import { describe, it, expect, vi } from 'vitest';
import { streamChat } from './api';

function createMockResponse(body: ReadableStream, status = 200) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

function createSSEStream(events: string[]) {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < events.length) {
        controller.enqueue(encoder.encode(events[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });
}

describe('streamChat', () => {
  it('streams token and done events', async () => {
    const events = [
      'data: {"type":"token","content":"Hello"}\n\n',
      'data: {"type":"done","message_id":"msg_1"}\n\n',
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse(createSSEStream(events))));

    const onEvent = vi.fn();
    const onError = vi.fn();

    await streamChat({
      message: 'hi',
      sessionId: 's1',
      onEvent,
      onError,
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          message: 'hi',
          session_id: 's1',
          options: { show_sql: true, stream: true },
        }),
      })
    );
    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent).toHaveBeenNthCalledWith(1, { type: 'token', content: 'Hello' });
    expect(onError).not.toHaveBeenCalled();
  });

  it('calls onError when HTTP status is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: { message: 'Bad request' } }), { status: 400 })
      )
    );

    const onEvent = vi.fn();
    const onError = vi.fn();

    await streamChat({ message: 'hi', sessionId: 's1', onEvent, onError });

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Bad request' }));
    expect(onEvent).not.toHaveBeenCalled();
  });

  it('aborts cleanly and does not call onError', async () => {
    const events: string[] = [];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse(createSSEStream(events))));

    const controller = new AbortController();
    const onEvent = vi.fn();
    const onError = vi.fn();

    const promise = streamChat({
      message: 'hi',
      sessionId: 's1',
      onEvent,
      onError,
      signal: controller.signal,
    });
    controller.abort();
    await promise;

    expect(onError).not.toHaveBeenCalled();
  });
});
