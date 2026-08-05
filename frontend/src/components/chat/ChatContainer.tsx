import React, { useEffect, useRef } from 'react';
import { IMessage } from '../../types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { MessageInput } from './MessageInput';

interface ChatContainerProps {
  messages: IMessage[];
  status: string;
  activeTool: string | null;
  onSend: (message: string) => void;
  onStop: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  status,
  activeTool,
  onSend,
  onStop,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status, activeTool]);

  const isBusy = status === 'connecting' || status === 'streaming';

  return (
    <div className="flex flex-col h-full bg-slate-950/40 relative">
      {/* Scrollable Message List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing / Active Tool Indicator */}
        {isBusy && (
          <div className="my-2">
            <TypingIndicator activeTool={activeTool} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <MessageInput
        onSend={onSend}
        onStop={onStop}
        disabled={isBusy}
        status={status}
      />
    </div>
  );
};
