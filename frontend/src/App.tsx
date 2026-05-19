import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

type ChatRole = 'user' | 'assistant';
type AiProviderName = 'groq' | 'gemini';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ChatResponse = {
  answer?: string;
  reply?: string;
  message?: string;
  error?: string;
};

const createId = () => {
  if ('crypto' in window && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getApiUrl = () => {
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
  return `${baseUrl}/api/chat`;
};

const getResponseMessage = (payload: ChatResponse) => {
  if (typeof payload.answer === 'string' && payload.answer.trim()) {
    return payload.answer.trim();
  }

  if (typeof payload.reply === 'string' && payload.reply.trim()) {
    return payload.reply.trim();
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message.trim();
  }

  return 'Ответ получен, но backend вернул данные в неожиданном формате.';
};

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AiProviderName>('groq');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const lastLoggedTranscriptRef = useRef('');
  const speechInputPrefixRef = useRef('');
  const textInputRef = useRef<HTMLTextAreaElement | null>(null);
  const chatThreadRef = useRef<HTMLDivElement | null>(null);
  const hasStartedChat = messages.length > 0 || isLoading;

  const {
    transcript,
    finalTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    browserSupportsContinuousListening,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  useEffect(() => {
    return () => {
      void SpeechRecognition.abortListening();
    };
  }, []);

  useEffect(() => {
    if (!listening) {
      setIsVoiceRecording(false);
    }
  }, [listening]);

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      setError('Голосовой ввод не поддерживается в этом браузере.');
      return;
    }

    if (!isMicrophoneAvailable) {
      setError('Доступ к микрофону запрещен. Проверьте разрешения браузера.');
    }
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable]);

  useEffect(() => {
    const recognizedText = finalTranscript.trim();

    if (!recognizedText || recognizedText === lastLoggedTranscriptRef.current) {
      return;
    }

    lastLoggedTranscriptRef.current = recognizedText;
    console.log(recognizedText);
  }, [finalTranscript]);

  useEffect(() => {
    const spokenText = transcript.trim();

    if (!spokenText) {
      return;
    }

    setInput([speechInputPrefixRef.current, spokenText].filter(Boolean).join(' '));
  }, [transcript]);

  useEffect(() => {
    const textInput = textInputRef.current;

    if (!textInput) {
      return;
    }

    textInput.style.height = 'auto';
    textInput.style.height = `${Math.min(textInput.scrollHeight, 180)}px`;
  }, [input]);

  useEffect(() => {
    const chatThread = chatThreadRef.current;

    if (!chatThread) {
      return;
    }

    chatThread.scrollTop = chatThread.scrollHeight;
  }, [messages, isLoading]);

  const stopVoiceInput = useCallback(
    ({ abort = false, reset = false }: { abort?: boolean; reset?: boolean } = {}) => {
      setIsVoiceRecording(false);

      if (abort) {
        void SpeechRecognition.abortListening();
      } else {
        void SpeechRecognition.stopListening();
      }

      if (reset) {
        resetTranscript();
        lastLoggedTranscriptRef.current = '';
        speechInputPrefixRef.current = '';
      }
    },
    [resetTranscript]
  );

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = input.trim();
    if (!trimmedMessage || isLoading) {
      return;
    }

    if (isVoiceRecording || listening) {
      stopVoiceInput({ abort: true, reset: true });
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: trimmedMessage
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: trimmedMessage,
          provider: selectedProvider
        })
      });

      const payload = (await response.json().catch(() => ({}))) as ChatResponse;

      if (!response.ok) {
        throw new Error(payload.error || payload.message || 'Не удалось получить ответ от сервера.');
      }

      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        content: getResponseMessage(payload)
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Неизвестная ошибка при отправке сообщения.';

      setInput(trimmedMessage);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const submitMessageOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    event.currentTarget.form?.requestSubmit();
  };

  const toggleVoiceInput = useCallback(() => {
    setError('');

    if (!browserSupportsSpeechRecognition) {
      setError('Голосовой ввод не поддерживается в этом браузере.');
      return;
    }

    if (!isMicrophoneAvailable) {
      setError('Доступ к микрофону запрещен. Проверьте разрешения браузера.');
      return;
    }

    if (isVoiceRecording || listening) {
      stopVoiceInput();
      return;
    }

    if (!browserSupportsContinuousListening) {
      setError('Непрерывное распознавание речи не поддерживается в этом браузере.');
      return;
    }

    resetTranscript();
    lastLoggedTranscriptRef.current = '';
    speechInputPrefixRef.current = input.trim();
    setIsVoiceRecording(true);

    void SpeechRecognition.startListening({
      continuous: true,
      interimResults: true,
      language: 'ru-RU'
    }).catch(() => {
      setIsVoiceRecording(false);
      setError('Не удалось запустить распознавание речи.');
    });
  }, [
    browserSupportsContinuousListening,
    browserSupportsSpeechRecognition,
    input,
    isMicrophoneAvailable,
    isVoiceRecording,
    listening,
    resetTranscript,
    stopVoiceInput
  ]);

  return (
    <main className={hasStartedChat ? 'app-shell chat-mode' : 'app-shell'}>
      <section
        className={hasStartedChat ? 'chat-screen' : 'assistant-screen'}
        aria-label={hasStartedChat ? 'Chat conversation' : undefined}
        aria-labelledby={!hasStartedChat ? 'page-title' : undefined}
      >
        {!hasStartedChat ? (
          <>
            <div className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M6.4 5.5h11.2A3.4 3.4 0 0 1 21 8.9v5.8a3.4 3.4 0 0 1-3.4 3.4h-4.15l-4.05 3.05a.8.8 0 0 1-1.28-.64V18.1H6.4A3.4 3.4 0 0 1 3 14.7V8.9a3.4 3.4 0 0 1 3.4-3.4Z" />
              </svg>
            </div>

            <div className="hero-copy">
              <p className="hello">Hi there!</p>
              <h1 id="page-title">What would you like to know?</h1>
              <p className="subtitle">
                <span className="subtitle-line">Use one of the most common prompts below</span>
                <span>or ask your own question</span>
              </p>
            </div>
          </>
        ) : (
          <div className="chat-thread" ref={chatThreadRef} aria-live="polite">
            {messages.map((message) => (
              <article className={`message ${message.role}`} key={message.id}>
                {message.role === 'assistant' ? (
                  <div className="markdown-message">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}
              </article>
            ))}
            {isLoading ? (
              <article className="message assistant loading-message" aria-label="Ответ генерируется">
                <span className="loading-dot" aria-hidden="true" />
              </article>
            ) : null}
          </div>
        )}

        <div className="chat-footer">
          {error ? (
            <div className="error-box" role="alert">
              {error}
            </div>
          ) : null}

          <div className="provider-switch" aria-label="AI provider">
            <button
              className={selectedProvider === 'groq' ? 'provider-option active' : 'provider-option'}
              disabled={isLoading}
              type="button"
              onClick={() => setSelectedProvider('groq')}
            >
              Groq
            </button>
            <button
              className={selectedProvider === 'gemini' ? 'provider-option active' : 'provider-option'}
              disabled={isLoading}
              type="button"
              onClick={() => setSelectedProvider('gemini')}
            >
              Gemini
            </button>
          </div>

          <form className="composer" onSubmit={submitMessage}>
            <button
              className={`voice-button ${isVoiceRecording ? 'active' : ''}`}
              disabled={!browserSupportsSpeechRecognition || !isMicrophoneAvailable || isLoading}
              type="button"
              onClick={toggleVoiceInput}
              aria-label={isVoiceRecording ? 'Stop recording' : 'Start voice recording'}
              title={isVoiceRecording ? 'Stop recording' : 'Start voice recording'}
            >
              {isVoiceRecording ? (
                <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                  <path d="M8 7.5A1.5 1.5 0 0 1 9.5 6h5A1.5 1.5 0 0 1 16 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 16.5v-9Z" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                  <path d="M12 2.75a3.25 3.25 0 0 0-3.25 3.25v6a3.25 3.25 0 0 0 6.5 0V6A3.25 3.25 0 0 0 12 2.75Z" />
                  <path d="M18.75 10.75a1 1 0 1 0-2 0 4.75 4.75 0 0 1-9.5 0 1 1 0 1 0-2 0 6.75 6.75 0 0 0 5.75 6.67V20a1 1 0 1 0 2 0v-2.58a6.75 6.75 0 0 0 5.75-6.67Z" />
                </svg>
              )}
            </button>
            <textarea
              aria-label="Текст сообщения"
              placeholder="Ask whatever you want"
              ref={textInputRef}
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={submitMessageOnEnter}
            />
            <button className="send-button" disabled={!input.trim() || isLoading} type="submit" aria-label="Send message">
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M8.22 4.22a1 1 0 0 1 1.42 0l7.07 7.07a1 1 0 0 1 0 1.42l-7.07 7.07a1 1 0 1 1-1.42-1.42L14.59 12 8.22 5.64a1 1 0 0 1 0-1.42Z" />
              </svg>
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default App;
