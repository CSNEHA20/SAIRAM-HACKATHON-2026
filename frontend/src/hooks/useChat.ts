import { useState, useCallback, useEffect, useRef } from 'react';
import { IMessage, ChatState, SSEEvent } from '../types';
import { authenticatedFetch, streamChat } from '../services/api';

export function useChat(initialSessionId: string = 'default-session') {
  const [state, setState] = useState<ChatState>({
    messages: [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: 'Welcome to **QueryMind AI**. Ask any question about your SQLite e-commerce database, and I will generate SQL, stream insights, and build interactive visual dashboards.',
        timestamp: new Date().toISOString(),
      },
    ],
    status: 'idle',
    activeTool: null,
    sessionId: initialSessionId,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Restore server-side session history on mount (persistent sessions feature).
  useEffect(() => {
    let cancelled = false;
    authenticatedFetch(`/api/session/${initialSessionId}/history`)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data?.messages || data.messages.length === 0) return;
        const restored: IMessage[] = data.messages.map((msg: any, idx: number) => ({
          id: `restored_${idx}`,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          sql_used: msg.sql_used || [],
          charts: msg.charts || [],
          diagrams: [],
          isStreaming: false,
        }));
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages.slice(0, 1), ...restored],
        }));
      })
      .catch(() => {
        // Ignore restore errors; keep the welcome message.
      });
    return () => {
      cancelled = true;
    };
  }, [initialSessionId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.status === 'streaming' || state.status === 'connecting') {
      return;
    }

    const userMessageId = `user_${Date.now()}`;
    const assistantMessageId = `assistant_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const userMsg: IMessage = {
      id: userMessageId,
      role: 'user',
      content,
      timestamp,
    };

    const assistantMsg: IMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp,
      isStreaming: true,
      sql_used: [],
      charts: [],
      diagrams: [],
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg, assistantMsg],
      status: 'connecting',
      activeTool: null,
    }));

    abortControllerRef.current = new AbortController();

    await streamChat({
      message: content,
      sessionId: state.sessionId,
      signal: abortControllerRef.current.signal,
      onEvent: (event: SSEEvent) => {
        setState((prev) => {
          const updatedMessages = [...prev.messages];
          const lastIdx = updatedMessages.length - 1;
          if (lastIdx < 0 || updatedMessages[lastIdx].id !== assistantMessageId) {
            return prev;
          }

          const currentMsg = { ...updatedMessages[lastIdx] };

          switch (event.type) {
            case 'tool_start':
              return {
                ...prev,
                status: 'streaming',
                activeTool: event.tool,
              };

            case 'tool_end':
              return {
                ...prev,
                activeTool: null,
              };

            case 'token':
              currentMsg.content += event.content;
              updatedMessages[lastIdx] = currentMsg;
              return {
                ...prev,
                status: 'streaming',
                messages: updatedMessages,
              };

            case 'sql':
              currentMsg.sql_used = [...(currentMsg.sql_used || []), event.content];
              updatedMessages[lastIdx] = currentMsg;
              return {
                ...prev,
                messages: updatedMessages,
              };

            case 'chart':
              currentMsg.charts = [...(currentMsg.charts || []), event];
              updatedMessages[lastIdx] = currentMsg;
              return {
                ...prev,
                messages: updatedMessages,
              };

            case 'diagram':
              currentMsg.diagrams = [...(currentMsg.diagrams || []), event];
              updatedMessages[lastIdx] = currentMsg;
              return {
                ...prev,
                messages: updatedMessages,
              };

            case 'done':
              currentMsg.isStreaming = false;
              updatedMessages[lastIdx] = currentMsg;
              return {
                ...prev,
                status: 'done',
                activeTool: null,
                messages: updatedMessages,
              };

            case 'error':
              currentMsg.isStreaming = false;
              currentMsg.error = event.message;
              updatedMessages[lastIdx] = currentMsg;
              return {
                ...prev,
                status: 'error',
                activeTool: null,
                messages: updatedMessages,
              };

            default:
              return prev;
          }
        });
      },
      onError: (error: Error) => {
        setState((prev) => {
          const updatedMessages = [...prev.messages];
          const lastIdx = updatedMessages.length - 1;
          if (lastIdx >= 0 && updatedMessages[lastIdx].id === assistantMessageId) {
            updatedMessages[lastIdx] = {
              ...updatedMessages[lastIdx],
              isStreaming: false,
              error: error.message,
            };
          }
          return {
            ...prev,
            status: 'error',
            activeTool: null,
            messages: updatedMessages,
          };
        });
      },
    });
  }, [state.sessionId, state.status]);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      status: 'idle',
      activeTool: null,
    }));
  }, []);

  // Start a completely fresh chat session
  const startNewChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const newSessionId = `session_${Date.now()}`;
    setState({
      messages: [
        {
          id: `welcome_${Date.now()}`,
          role: 'assistant',
          content: 'Welcome to **QueryMind AI**. Ask any question about your SQLite e-commerce database, and I will generate SQL, stream insights, and build interactive visual dashboards.',
          timestamp: new Date().toISOString(),
        },
      ],
      status: 'idle',
      activeTool: null,
      sessionId: newSessionId,
    });
  }, []);

  return {
    messages: state.messages,
    status: state.status,
    activeTool: state.activeTool,
    sessionId: state.sessionId,
    sendMessage,
    stopStreaming,
    startNewChat,
  };
}
