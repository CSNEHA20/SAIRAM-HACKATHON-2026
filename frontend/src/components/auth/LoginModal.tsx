import React, { useState } from 'react';
import { login, logout, getAuthToken } from '../../services/api';

export interface LoginModalProps {
  onAuthChange?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onAuthChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = Boolean(getAuthToken());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login({ username, password });
      setIsOpen(false);
      onAuthChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    onAuthChange?.();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-primary hover:bg-surface-container-high transition-colors p-2 rounded cursor-pointer active:opacity-80 relative"
        title={isAuthenticated ? 'Authenticated' : 'Login / API Key'}
      >
        <span className="material-symbols-outlined" data-icon={isAuthenticated ? 'lock' : 'lock_open'}>
          {isAuthenticated ? 'lock' : 'lock_open'}
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-lg shadow-xl w-full max-w-sm p-6">
            <h2 className="font-headline-sm text-on-surface mb-4">
              {isAuthenticated ? 'Authentication' : 'Login'}
            </h2>

            {isAuthenticated ? (
              <div className="space-y-4">
                <p className="text-label-md text-on-surface-variant">
                  You are authenticated. The access token is stored locally.
                </p>
                <button
                  onClick={handleLogout}
                  className="w-full bg-error-container text-on-error-container font-label-md h-10 rounded hover:brightness-110 transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-label-sm text-on-surface-variant mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
                    placeholder="dataflow"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-label-sm text-on-surface-variant mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-on-surface focus:outline-none focus:border-primary"
                    placeholder="••••••"
                  />
                </div>
                {error && (
                  <p className="text-error text-label-sm">{error}</p>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 bg-surface-container-high text-on-surface font-label-md h-10 rounded hover:brightness-110 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !username || !password}
                    className="flex-1 bg-primary-container text-on-primary-container font-label-md h-10 rounded hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
