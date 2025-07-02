use std::path::PathBuf;
use std::process::Command;

/// Tool path management for external dependencies
pub struct ToolPaths {
    pub ffmpeg: PathBuf,
    pub ffprobe: PathBuf,
    pub yt_dlp: PathBuf,
}

impl ToolPaths {
    /// Find and verify all required tools
    pub fn discover() -> Result<Self, String> {
        let ffmpeg = Self::find_tool("ffmpeg")?;
        let ffprobe = Self::find_tool("ffprobe")?;
        let yt_dlp = Self::find_tool("yt-dlp")?;

        // Verify tools are working
        Self::verify_tool(&ffmpeg, &["-version"])?;
        Self::verify_tool(&ffprobe, &["-version"])?;
        Self::verify_tool(&yt_dlp, &["--version"])?;

        Ok(ToolPaths {
            ffmpeg,
            ffprobe,
            yt_dlp,
        })
    }

    /// Find a tool in common locations
    fn find_tool(name: &str) -> Result<PathBuf, String> {
        // Common installation paths in order of preference
        let search_paths = [
            format!("/opt/homebrew/bin/{}", name),
            format!("/usr/local/bin/{}", name),
            format!("/usr/bin/{}", name),
            format!("/bin/{}", name),
        ];

        for path in &search_paths {
            let tool_path = PathBuf::from(path);
            if tool_path.exists() && tool_path.is_file() {
                return Ok(tool_path);
            }
        }

        // Try which command as fallback
        if let Ok(output) = Command::new("which").arg(name).output() {
            if output.status.success() {
                let path_string = String::from_utf8_lossy(&output.stdout);
                let path_str = path_string.trim();
                if !path_str.is_empty() {
                    return Ok(PathBuf::from(path_str));
                }
            }
        }

        Err(format!(
            "{} not found. Please install with: brew install {}",
            name,
            if name == "yt-dlp" { "yt-dlp" } else { "ffmpeg" }
        ))
    }

    /// Verify a tool works by running it with test arguments
    fn verify_tool(path: &PathBuf, args: &[&str]) -> Result<(), String> {
        Command::new(path)
            .args(args)
            .output()
            .map_err(|e| format!("Failed to verify {}: {}", path.display(), e))?;
        Ok(())
    }

    /// Get the directory containing ffmpeg tools
    pub fn ffmpeg_dir(&self) -> Option<&std::path::Path> {
        self.ffmpeg.parent()
    }

    /// Create enhanced PATH including tool directories
    pub fn enhanced_path(&self) -> String {
        let current_path = std::env::var("PATH").unwrap_or_default();
        if let Some(ffmpeg_dir) = self.ffmpeg_dir() {
            format!("{}:{}", ffmpeg_dir.display(), current_path)
        } else {
            current_path
        }
    }
}