
import React from 'react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-lg">
      <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-md hover:bg-white/10 transition-colors" aria-label="Open sidebar">
          <i className="fas fa-bars text-xl"></i>
        </button>
        <img alt="Eburon" className="w-8 h-8 rounded-lg" src="https://eburon-vibe.vercel.app/eburon-icon.png" />
        <div className="flex items-center gap-3">
          <h1 className="font-semibold tracking-wide text-lg">Gemini CSR Studio</h1>
          <span className="hidden sm:inline bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-gray-400">
            Live Demo
          </span>
        </div>
        <div className="ml-auto flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-[var(--muted)]">API Status</span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-[var(--muted)]">Operational</span>
            </div>
        </div>
      </div>
    </header>
  );
};
