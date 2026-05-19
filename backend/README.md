# Backend

Nest.js backend for the AI voice chat assistant.

## Scripts

```bash
npm install
npm run start:dev
npm run build
```

The app listens on `PORT` or `3000` by default. It binds to `HOST` or `127.0.0.1` by default.

## Environment

Create a local `.env` file and set your Gemini API key:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

The key is read only by the backend and must not be exposed to the frontend.

## Chat Endpoint

Send a message to Gemini:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello Gemini"}'
```

Successful response:

```json
{
  "reply": "Gemini response here"
}
```

Invalid or empty messages return `400`. Missing backend configuration returns `500`. Gemini API failures return `502`.
