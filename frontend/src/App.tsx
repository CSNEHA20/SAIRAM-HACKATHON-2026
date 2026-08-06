import React, { useEffect, useState } from 'react';
import { useChat } from './hooks/useChat';
import { useQueryHistory } from './hooks/useQueryHistory';
import { authenticatedFetch, getAuthToken } from './services/api';
import { ChatContainer } from './components/chat/ChatContainer';
import { TopAppBar } from './components/layout/TopAppBar';
import { SideNavBar } from './components/layout/SideNavBar';
import { InspectorPanel } from './components/layout/InspectorPanel';
import { LoginModal } from './components/auth/LoginModal';

export const App: React.FC = () => {
  const { messages, status, activeTool, sendMessage, stopStreaming } = useChat('main-session');
  const { history, favorites, addQuery, removeQuery, toggleFavorite, clearHistory } = useQueryHistory();
  const [health, setHealth] = useState<{ status: string; database: string } | null>(null);

  useEffect(() => {
    authenticatedFetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: 'offline', database: 'disconnected' }));
  }, []);

  const handleSendMessage = (msg: string) => {
    addQuery(msg);
    sendMessage(msg);
  };

  return (
    <div className="flex flex-col h-full bg-background text-on-surface font-body-sm relative overflow-hidden">
      <TopAppBar
        health={health}
        rightActions={<LoginModal onAuthChange={() => window.location.reload()} />}
      />

      <div className="flex flex-1 overflow-hidden">
        <SideNavBar 
          history={history}
          favorites={favorites}
          onSelectQuery={handleSendMessage}
          onRemoveQuery={removeQuery}
          onToggleFavorite={toggleFavorite}
          onClearHistory={clearHistory}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-background relative border-r border-outline-variant">
          <ChatContainer
            messages={messages}
            status={status}
            activeTool={activeTool}
            onSend={handleSendMessage}
            onStop={stopStreaming}
          />
        </main>

        <InspectorPanel status={status} activeTool={activeTool} />
      </div>
    </div>
  );
};
