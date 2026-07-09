# VibeForge 🎵

VibeForge is an AI-powered Spotify playlist management platform built with Next.js, TypeScript, and Spotify's Web API.

Create playlists with AI, analyze playlist vibes, discover similar tracks, manage playlists, control Spotify playback, and explore your music library through a modern interface.

---

## Features

### 🎧 Spotify Integration
- Spotify OAuth authentication
- View owned and collaborative playlists
- Browse playlist tracks
- View currently playing track
- Spotify profile integration

### 🤖 AI-Powered Tools
- Generate playlist analysis and vibe breakdowns
- Create playlists using AI prompts
- Generate track recommendations
- Discover similar songs
- Research songs and artists

### 🎼 Playlist Management
- Create new playlists
- Add AI-generated tracks to playlists
- Remove individual tracks
- Bulk track removal
- Delete playlists
- Playlist track previews

### ▶️ Playback Controls
- Play tracks directly from VibeForge
- Play entire playlists
- Add tracks to Spotify queue
- Playback management
- Currently playing status

### 🎨 Modern UI
- Responsive design
- Dark theme interface
- Custom playlist views
- Toast notifications
- Confirmation dialogs
- Sidebar navigation

---

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Motion

### Authentication
- NextAuth.js
- Spotify OAuth

### AI Services
- Groq API
- OpenAI SDK

### APIs
- Spotify Web API
- Spotify Player API

---

## Project Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── ai/
│   │   ├── ai-playlist/
│   │   ├── playlist/
│   │   ├── playlist-tracks/
│   │   ├── player-control/
│   │   ├── currently-playing/
│   │   └── auth/
│   └── page.tsx
│
├── components/
│   ├── ai/
│   ├── common/
│   ├── layout/
│   └── playlist/
│
├── hooks/
│
└── lib/
```

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd vibeforge
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Create environment variables

Create a `.env.local` file:

```env
NEXTAUTH_URL=http://localhost:3000

NEXTAUTH_SECRET=your-secret

SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret

GROQ_API_KEY=your-groq-key

(OPTIONAL)OPENAI_API_KEY=your-openai-key

```

---

## Spotify Setup

1. Open the Spotify Developer Dashboard
2. Create a new application
3. Add the following Redirect URI:

```text
http://localhost:3000/api/auth/callback/spotify
```

4. Copy:
   - Client ID
   - Client Secret

5. Add them to `.env.local`

---

## Running Locally

Start the development server:

```bash
pnpm run dev
```

Open:

```text
http://localhost:3000
```

---

## Build for Production

```bash
pnpm run build
```

Start production server:

```bash
pnpm start
```

---

## Spotify Permissions

VibeForge requests access to:

- Read library (liked songs)
- Read private playlists
- Read collaborative playlists
- Create playlists
- Modify playlists
- Read user profile
- Read email address
- Control Spotify playback

---

## Main Functionality

### AI Playlist Creator

Generate playlists from prompts such as:

```text
Late night cyberpunk drive
```

```text
Sad anime ending songs
```

```text
High-energy gym playlist
```

The AI generates track suggestions and can automatically create or update playlists.

### Playlist Analysis

Analyze any playlist to receive:

- Mood breakdown
- Genre overview
- Energy level
- Listening recommendations
- AI-generated insights

### Similar Track Discovery

Select a track and discover songs with similar:

- Energy
- Mood
- Genre
- Listening experience

---

## Future Improvements

- Playlist sharing
- Multi-provider AI support
- UI makeover

---

## Author

Developed by Wesley Poth as a Spotify playlist management and AI music discovery platform.

---

## License

This project is for educational and personal development purposes.
