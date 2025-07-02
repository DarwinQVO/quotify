use serde::{Deserialize, Serialize};
use std::process::Command;
use tempfile::NamedTempFile;
use tauri::Manager;

mod paths;
use paths::ToolPaths;

#[derive(Debug, Serialize, Deserialize)]
struct VideoMetadata {
    title: String,
    channel: String,
    duration: i64,
    publish_date: String,
    views: i64,
    thumbnail: String,
    url: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct TranscriptWord {
    text: String,
    start: f64,
    end: f64,
    speaker: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct TranscriptionResult {
    words: Vec<TranscriptWord>,
    full_text: String,
}

#[tauri::command]
async fn scrape_metadata(url: String) -> Result<VideoMetadata, String> {
    // Validate URL format
    if !url.starts_with("https://www.youtube.com/") && !url.starts_with("https://youtu.be/") {
        return Err("Only YouTube URLs are supported".to_string());
    }

    // Discover tools for metadata scraping
    let tools = ToolPaths::discover()
        .map_err(|e| format!("Tool discovery failed: {}", e))?;

    let output = Command::new(&tools.yt_dlp)
        .args(&[
            "--dump-json",
            "--no-download",
            &url,
        ])
        .env("PATH", &tools.enhanced_path())
        .output()
        .map_err(|e| format!("Failed to run yt-dlp: {}. Make sure yt-dlp is installed.", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("yt-dlp failed: {}", error));
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    
    // Validate JSON is not empty and properly formatted
    if json_str.trim().is_empty() {
        return Err("yt-dlp returned empty response".to_string());
    }

    let json: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| format!("Failed to parse yt-dlp output: {}", e))?;

    // Validate required fields exist
    if json.get("title").is_none() {
        return Err("Invalid video data: missing title".to_string());
    }

    Ok(VideoMetadata {
        title: json["title"].as_str().unwrap_or("Unknown Title").to_string(),
        channel: json["uploader"].as_str().unwrap_or("Unknown Channel").to_string(),
        duration: json["duration"].as_i64().unwrap_or(0),
        publish_date: json["upload_date"].as_str().unwrap_or("").to_string(),
        views: json["view_count"].as_i64().unwrap_or(0),
        thumbnail: json["thumbnail"].as_str().unwrap_or("").to_string(),
        url: json["webpage_url"].as_str().unwrap_or(&url).to_string(),
    })
}

#[tauri::command]
async fn transcribe_audio(url: String, api_key: String) -> Result<TranscriptionResult, String> {
    if api_key.is_empty() {
        return Err("OpenAI API key is required".to_string());
    }

    // Create temp directory for audio file
    let temp_file = NamedTempFile::with_suffix(".mp3")
        .map_err(|e| format!("Failed to create temp file: {}", e))?;
    let audio_path = temp_file.path();

    // Verify tools are available (but use bash approach for execution)
    let _tools = ToolPaths::discover()
        .map_err(|e| format!("Tool discovery failed: {}", e))?;

    // Validate URL to prevent command injection
    if !url.starts_with("https://www.youtube.com/") && !url.starts_with("https://youtu.be/") {
        return Err("Only YouTube URLs are supported for security reasons".to_string());
    }

    // Use yt-dlp directly
    let download_output = Command::new("yt-dlp")
        .args(&[
            "--extract-audio",
            "--audio-format", "mp3",
            "--audio-quality", "192",
            "--output", &audio_path.to_string_lossy(),
            &url
        ])
        .output()
        .map_err(|e| format!("Failed to execute yt-dlp: {}. Make sure yt-dlp is installed.", e))?;

    if !download_output.status.success() {
        let error = String::from_utf8_lossy(&download_output.stderr);
        return Err(format!("yt-dlp failed: {}", error));
    }

    // Read the audio file
    let audio_bytes = std::fs::read(&audio_path)
        .map_err(|e| format!("Failed to read audio file: {}", e))?;

    // Call OpenAI Whisper API
    let client = reqwest::Client::new();
    let file_part = reqwest::multipart::Part::bytes(audio_bytes)
        .file_name("audio.mp3")
        .mime_str("audio/mpeg")
        .map_err(|e| format!("Failed to create file part: {}", e))?;

    let form = reqwest::multipart::Form::new()
        .part("file", file_part)
        .text("model", "whisper-1")
        .text("response_format", "verbose_json")
        .text("timestamp_granularities[]", "word");

    let response = client
        .post("https://api.openai.com/v1/audio/transcriptions")
        .header("Authorization", format!("Bearer {}", api_key))
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("Failed to send request to OpenAI: {}", e))?;

    if !response.status().is_success() {
        let status_code = response.status().as_u16();
        let error_text = response.text().await.unwrap_or_default();
        
        // Handle timeout errors more gracefully
        if status_code == 504 || status_code == 502 || status_code == 503 {
            return Err(format!("OpenAI API timeout ({}). The transcript may still be processing in the background.", status_code));
        }
        
        return Err(format!("OpenAI API error ({}): {}", status_code, error_text));
    }

    let result: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

    // Parse words from response and add speaker identification
    let mut words: Vec<TranscriptWord> = result["words"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .map(|word| TranscriptWord {
            text: word["word"].as_str().unwrap_or("").trim().to_string(),
            start: word["start"].as_f64().unwrap_or(0.0),
            end: word["end"].as_f64().unwrap_or(0.0),
            speaker: None,
        })
        .filter(|w| !w.text.is_empty())
        .collect();

    // Simple speaker diarization based on pauses and patterns
    add_speaker_identification(&mut words);

    let full_text = result["text"].as_str().unwrap_or("").to_string();

    Ok(TranscriptionResult { words, full_text })
}

#[tauri::command]
fn generate_deep_link(url: String, timestamp: f64) -> String {
    let video_id = extract_video_id(&url);
    if video_id.is_empty() {
        return url;
    }
    format!("https://youtu.be/{}?t={}", video_id, timestamp as i64)
}

#[tauri::command]
async fn save_app_data(app: tauri::AppHandle, key: String, data: serde_json::Value) -> Result<(), String> {
    use tauri_plugin_store::StoreBuilder;
    
    let mut store = StoreBuilder::new(&app, "quotify-data.json")
        .build()
        .map_err(|e| format!("Store error: {}", e))?;
    
    store.set(key, data);
    store.save().map_err(|e| format!("Save error: {:?}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn load_app_data(app: tauri::AppHandle, key: String) -> Result<Option<serde_json::Value>, String> {
    use tauri_plugin_store::StoreBuilder;
    
    let store = StoreBuilder::new(&app, "quotify-data.json")
        .build()
        .map_err(|e| format!("Store error: {}", e))?;
    
    Ok(store.get(&key))
}

#[tauri::command]
async fn clear_app_data(app: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_store::StoreBuilder;
    
    
    let mut store = StoreBuilder::new(&app, "quotify-data.json")
        .build()
        .map_err(|e| format!("Store error: {}", e))?;
    
    store.clear();
    store.save().map_err(|e| format!("Save error: {:?}", e))?;
    
    Ok(())
}

fn add_speaker_identification(words: &mut Vec<TranscriptWord>) {
    if words.is_empty() {
        return;
    }

    let mut current_speaker = "Speaker 1";
    let mut speaker_count = 1;
    
    for i in 0..words.len() {
        // Detect speaker change based on pause length (>2 seconds)
        if i > 0 {
            let pause_duration = words[i].start - words[i-1].end;
            
            // Long pause suggests speaker change
            if pause_duration > 2.0 {
                speaker_count += 1;
                current_speaker = if speaker_count % 2 == 1 { "Speaker 1" } else { "Speaker 2" };
            }
            
            // Question words often indicate interviewer
            let text_lower = words[i].text.to_lowercase();
            if (text_lower.starts_with("what") || 
                text_lower.starts_with("how") || 
                text_lower.starts_with("why") ||
                text_lower.starts_with("when") ||
                text_lower.starts_with("where") ||
                text_lower.contains("?")) && 
                i > 0 && words[i-1].text.ends_with('.') {
                current_speaker = "Interviewer";
            }
        }
        
        words[i].speaker = Some(current_speaker.to_string());
    }
}

fn extract_video_id(url: &str) -> String {
    // Handle different YouTube URL formats
    if let Some(v_pos) = url.find("v=") {
        let start = v_pos + 2;
        let end = url[start..].find('&').map(|i| start + i).unwrap_or(url.len());
        url[start..end].to_string()
    } else if let Some(youtu_be_pos) = url.find("youtu.be/") {
        let start = youtu_be_pos + 9;
        let end = url[start..].find('?').map(|i| start + i).unwrap_or(url.len());
        url[start..end].to_string()
    } else if let Some(embed_pos) = url.find("embed/") {
        let start = embed_pos + 6;
        let end = url[start..].find('?').map(|i| start + i).unwrap_or(url.len());
        url[start..end].to_string()
    } else {
        "".to_string()
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            scrape_metadata,
            transcribe_audio,
            generate_deep_link,
            save_app_data,
            load_app_data,
            clear_app_data
        ])
        .setup(|_app| {
            // Auto-update disabled for now - will be configured later
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}