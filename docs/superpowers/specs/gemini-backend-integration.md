# Gemini Backend Integration

## Goal

Add a backend chat endpoint that accepts a user message, sends it to Google Gemini, and returns Gemini's text reply to the frontend.

## Backend Endpoint Behavior

The backend exposes `POST /api/chat`. The endpoint accepts JSON with a required non-empty `message` string and returns `{ "reply": "..." }` on success.

## Gemini API Integration

Gemini calls are handled in a dedicated service. The service uses a free-tier-compatible Gemini model such as `gemini-2.5-flash-lite` and keeps provider-specific logic outside the controller.

## Environment Variables

The API key is read from `GEMINI_API_KEY`. It must never be hardcoded and must never be exposed to the frontend.

## Error Handling

- Invalid or empty `message` returns `400`.
- Missing `GEMINI_API_KEY` returns `500` with a clear configuration error.
- Gemini API failures return `502`.
- Unexpected backend errors return `500`.

## Acceptance Criteria

- `POST /api/chat` validates request input.
- The backend sends valid messages to Gemini.
- Successful responses return `{ "reply": "Gemini response here" }`.
- API key is read only from environment variables.
- `.env.example` documents `GEMINI_API_KEY`.
- Backend documentation includes setup and endpoint examples.
- The backend builds without TypeScript errors.
