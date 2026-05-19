# Groq AI Provider

## Goal

Add Groq as a second backend AI provider while keeping the existing Gemini integration available.

## Why Groq

Gemini free-tier requests can hit quota limits quickly during testing. Groq should be the default provider so the chat endpoint can continue working without depending only on Gemini quota.

## Provider Selection

The backend reads `AI_PROVIDER` from environment variables:

- Missing value defaults to `groq`
- `AI_PROVIDER=groq` uses Groq
- `AI_PROVIDER=gemini` uses Gemini
- Any other value returns a clear backend configuration error

## Environment Variables

- `AI_PROVIDER=groq`
- `GROQ_API_KEY=your_groq_api_key_here`
- `GROQ_MODEL=llama-3.1-8b-instant`
- `GEMINI_API_KEY=your_gemini_api_key_here`
- `GEMINI_MODEL=gemini-2.5-flash-lite`

## Error Handling

The backend should return `400` for empty messages, `500` for missing or invalid configuration, `429` for provider quota/rate limits, `502` for provider API failures, and `500` for unexpected server errors. Frontend responses must not expose API keys, stack traces, or raw provider internals.

## Acceptance Criteria

- `POST /api/chat` still accepts `{ "message": "..." }`
- Successful response remains `{ "reply": "..." }`
- Groq is used by default when `AI_PROVIDER` is missing
- Gemini can still be selected with `AI_PROVIDER=gemini`
- Backend builds successfully
- Provider errors are logged on the backend with clean client-facing responses
