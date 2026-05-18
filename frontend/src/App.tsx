import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ChatResponse = {
  answer?: string;
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
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const speechSupported = useMemo(() => {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = input.trim();
    if (!trimmedMessage || isLoading) {
      return;
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
        body: JSON.stringify({ message: trimmedMessage })
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

  const toggleVoiceInput = useCallback(() => {
    setError('');

    if (!speechSupported) {
      setError('Голосовой ввод не поддерживается в этом браузере.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      return;
    }

    const recognition = new Recognition();
    const initialInput = input.trim();
    let finalTranscript = '';

    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;

        if (event.results[index].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const spokenText = `${finalTranscript} ${interimTranscript}`.trim();
      setInput([initialInput, spokenText].filter(Boolean).join(' '));
    };

    recognition.onerror = (event) => {
      const browserMessage = event.message ? ` ${event.message}` : '';
      setError(`Не удалось распознать речь: ${event.error}.${browserMessage}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [input, isListening, speechSupported]);

  return (
    <main className="app-shell">
      <section className="assistant-screen" aria-labelledby="page-title">
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

        <div className={messages.length > 0 || isLoading ? 'conversation visible' : 'conversation'} aria-live="polite">
          {messages.map((message) => (
            <article className={`message ${message.role}`} key={message.id}>
              <span>{message.role === 'user' ? 'You' : 'Assistant'}</span>
              <p>{message.content}</p>
            </article>
          ))}
          {isLoading ? (
            <article className="message assistant loading-message">
              <span>Assistant</span>
              <p>Thinking...</p>
            </article>
          ) : null}
        </div>

        {error ? (
          <div className="error-box" role="alert">
            {error}
          </div>
        ) : null}

        <form className="composer" onSubmit={submitMessage}>
          <button
            className={`voice-button ${isListening ? 'active' : ''}`}
            disabled={!speechSupported || isLoading}
            type="button"
            onClick={toggleVoiceInput}
            aria-label={isListening ? 'Stop recording' : 'Start voice recording'}
            title={isListening ? 'Stop recording' : 'Start voice recording'}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
              <path d="M12 2.75a3.25 3.25 0 0 0-3.25 3.25v6a3.25 3.25 0 0 0 6.5 0V6A3.25 3.25 0 0 0 12 2.75Z" />
              <path d="M18.75 10.75a1 1 0 1 0-2 0 4.75 4.75 0 0 1-9.5 0 1 1 0 1 0-2 0 6.75 6.75 0 0 0 5.75 6.67V20a1 1 0 1 0 2 0v-2.58a6.75 6.75 0 0 0 5.75-6.67Z" />
            </svg>
          </button>
          <input
            aria-label="Текст сообщения"
            placeholder="Ask whatever you want"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <button className="send-button" disabled={!input.trim() || isLoading} type="submit" aria-label="Send message">
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
              <path d="M8.22 4.22a1 1 0 0 1 1.42 0l7.07 7.07a1 1 0 0 1 0 1.42l-7.07 7.07a1 1 0 1 1-1.42-1.42L14.59 12 8.22 5.64a1 1 0 0 1 0-1.42Z" />
            </svg>
          </button>
        </form>
      </section>
    </main>
  );
}

export default App;
