import { Quote } from '@/types'

// Google OAuth 2.0 PKCE implementation for desktop apps
const GOOGLE_CLIENT_ID = 'your-google-client-id'
const GOOGLE_REDIRECT_URI = 'http://localhost:8080/oauth/callback'
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/documents'

interface GoogleAuthResult {
  accessToken: string
  refreshToken?: string
}

export async function authenticateWithGoogle(): Promise<GoogleAuthResult> {
  // Generate PKCE code verifier and challenge
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  
  // Build authorization URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', GOOGLE_SCOPE)
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')
  
  // Open browser for authorization  
  await (window as any).__TAURI__.shell.open(authUrl.toString())
  
  // Start local server to receive callback
  const authCode = await startOAuthServer()
  
  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      code: authCode,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_REDIRECT_URI,
    }),
  })
  
  const tokens = await tokenResponse.json()
  
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  }
}

export async function appendQuotesToGoogleDoc(
  documentId: string,
  quotes: Quote[],
  accessToken: string
): Promise<void> {
  const requests = quotes.map(quote => ({
    insertText: {
      location: {
        index: 1,
      },
      text: `${quote.text} ${quote.citation}\n${quote.deepLink}\n\n`,
    },
  }))
  
  const response = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests,
      }),
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to append quotes to Google Doc')
  }
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/[+/]/g, (match) => (match === '+' ? '-' : '_'))
    .replace(/=/g, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/[+/]/g, (match) => (match === '+' ? '-' : '_'))
    .replace(/=/g, '')
}

async function startOAuthServer(): Promise<string> {
  return new Promise((resolve) => {
    // This would require a local server implementation
    // For now, we'll simulate the OAuth flow
    setTimeout(() => {
      resolve('simulated_auth_code')
    }, 2000)
  })
}