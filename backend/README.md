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

Create a local `.env` file. Groq is the default provider, and Gemini is still available as an alternative.

```bash
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
```

The API keys are read only by the backend and must not be exposed to the frontend.

`AI_PROVIDER` controls which provider handles `POST /api/chat`:

- missing value defaults to `groq`
- `AI_PROVIDER=groq` uses Groq
- `AI_PROVIDER=gemini` uses Gemini

Use a Groq API key from the Groq console and put it in `GROQ_API_KEY`. Use a Gemini API key in `GEMINI_API_KEY` only when selecting Gemini.

## Chat Endpoint

Send a message to the configured AI provider:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

Successful response:

```json
{
  "reply": "AI response here"
}
```

Invalid or empty messages return `400`. Missing or invalid backend configuration returns `500`. Provider quota or rate limits return `429`. Provider API failures return `502`.

## Vercel Deployment

Deploy the `backend` directory as a separate Vercel project.

Use these project settings:

- Root Directory: `backend`
- Framework Preset: Other
- Build Command: `npm run build`

The Vercel serverless entrypoint is `api/index.ts`. All incoming requests are routed to the NestJS app through `vercel.json`, so `POST /api/chat` keeps the same URL path.

Set the same backend environment variables in Vercel Project Settings:

```bash
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
```

CORS is enabled because the frontend is expected to be deployed as a separate Vercel project and call this backend by URL.
