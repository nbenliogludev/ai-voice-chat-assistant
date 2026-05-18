# ai-voice-chat-assistant

Test assignment project for an AI text and voice chat assistant.

## Frontend

The React frontend lives in `frontend`.

```bash
cd frontend
npm install
npm run dev
```

The frontend sends messages to `POST /api/chat` with this body:

```json
{
  "message": "Hello"
}
```

The expected backend response shape is:

```json
{
  "answer": "Hello! How can I help?"
}
```

Voice input uses the browser Web Speech API and is available in browsers that support speech recognition.
