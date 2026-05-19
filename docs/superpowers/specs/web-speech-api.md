# Web Speech API Voice Input

## Goal

Add minimal voice input support to the existing frontend microphone button using the Web Speech API through `react-speech-recognition`.

## Voice Recognition Flow

When the user clicks the existing microphone button, the app starts browser speech recognition with Russian language recognition (`ru-RU`). If the browser needs microphone access, it should request permission through the normal browser permission prompt. Recognized speech is logged to the browser console for this iteration.

## Browser Limitations

Speech recognition support depends on the browser. If the browser does not expose speech recognition, the microphone button should be disabled or a simple fallback message should be shown. If microphone permission is denied, the app should handle the error gracefully and keep the text input usable.

## Acceptance Criteria

- The existing microphone button starts voice recognition.
- Recognition uses `ru-RU`.
- Recognized text is logged with `console.log`.
- Unsupported browsers do not break the UI.
- Microphone permission denial is handled gracefully.
- Existing text input and send-message behavior continue to work.
- The frontend builds without TypeScript errors.
