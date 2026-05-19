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

## Docker

Create `backend/.env` from `backend/.env.example` and set at least `GROQ_API_KEY`.
Groq is the default provider.

Run the whole app with one command:

```bash
docker compose up --build
```

After startup:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Chat endpoint: `POST http://localhost:3000/api/chat`

The frontend container proxies `/api` requests to the backend container through the internal Docker network.
