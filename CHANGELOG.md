### 2025-08-25 (ISO week 35)

- **release**: 1.0.1-20250825-w35-elevenlabs
- **env**: rotated ElevenLabs credentials (`ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`) for Наш AI‑помощник
- **docs**: added `.env.example` with placeholders and notes

Notes:
- Server uses `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID`; client relies on `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`. Ensure the public agent matches the one intended for the widget (`src/components/VoiceWidget.tsx`).
- `.env` is ignored by git; update deployment environment variables accordingly.


