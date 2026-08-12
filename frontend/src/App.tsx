import React, { useEffect, useState } from 'react';
import { useChat } from './hooks/useChat';
import { useQueryHistory } from './hooks/useQueryHistory';
import { authenticatedFetch, getAuthToken } from './services/api';
import { ChatContainer } from './components/chat/ChatContainer';
import { TopAppBar } from './components/layout/TopAppBar';
import { SideNavBar } from './components/layout/SideNavBar';
import { InspectorPanel } from './components/layout/InspectorPanel';
import { LoginModal } from './components/auth/LoginModal';
import { DatasetModal } from './components/dataset/DatasetModal';

export const App: React.FC = () => {
  const { messages, status, activeTool, sendMessage, stopStreaming, startNewChat } = useChat('main-session');
  const { history, favorites, addQuery, removeQuery, toggleFavorite, clearHistory } = useQueryHistory();
  const [health, setHealth] = useState<{ status: string; database: string } | null>(null);
  const [datasetModalOpen, setDatasetModalOpen] = useState(false);

  const fetchHealth = () => {
    authenticatedFetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: 'offline', database: 'disconnected' }));
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleSendMessage = (msg: string) => {
    addQuery(msg);
    sendMessage(msg);
  };

  const handleNewQuery = () => {
    startNewChat();
  };

  return (
    <div className="antialiased min-h-screen flex flex-col font-body-md text-body-md bg-background dark:bg-[#0d0d0d] text-on-surface dark:text-[#e2e2e2] selection:bg-secondary-container selection:text-on-secondary-container overflow-hidden transition-colors duration-300">
      <TopAppBar
        health={health}
        onOpenDataset={() => setDatasetModalOpen(true)}
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
          onNewQuery={handleNewQuery}
        />

        <main className="flex-1 md:ml-64 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
          <ChatContainer
            messages={messages}
            status={status}
            activeTool={activeTool}
            onSend={handleSendMessage}
            onStop={stopStreaming}
          />
          <InspectorPanel status={status} activeTool={activeTool} />
        </main>
      </div>

      <DatasetModal
        isOpen={datasetModalOpen}
        onClose={() => setDatasetModalOpen(false)}
        onSuccess={() => {
          setDatasetModalOpen(false);
          fetchHealth();
        }}
      />
    </div>
  );
};
