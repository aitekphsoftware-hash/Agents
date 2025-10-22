
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  activeView: View;
  onSwitchView: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
}

const NavItem: React.FC<{ icon: string; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-gradient-to-r from-[rgba(25,194,255,.14)] to-[rgba(246,196,83,.12)] text-white font-medium'
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
    }`}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onSwitchView, isOpen, onClose }) => {
  const navItems = [
    { id: 'projects' as View, icon: '📊', label: 'Projects' },
    { id: 'agents' as View, icon: '🤖', label: 'Agents' },
    { id: 'knowledge' as View, icon: '📚', label: 'Knowledge' },
    { id: 'models' as View, icon: '🧠', label: 'Language Models' },
    { id: 'voices' as View, icon: '🎙️', label: 'Voices' },
  ];

  const sidebarContent = (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl glow p-3 h-max sticky top-20">
      <div className="text-xs uppercase tracking-wide text-[var(--muted)] px-2 mb-2 font-semibold">Navigation</div>
      <nav className="flex flex-col gap-1">
        {navItems.map(item => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeView === item.id}
            onClick={() => onSwitchView(item.id)}
          />
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={onClose}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <aside className="fixed top-0 left-0 h-full w-72 p-4 z-50">
            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 h-full">
              <div className="text-xs uppercase tracking-wide text-[var(--muted)] px-2 mb-2 font-semibold">Navigation</div>
              <nav className="flex flex-col gap-1">
                {navItems.map(item => (
                  <NavItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    isActive={activeView === item.id}
                    onClick={() => onSwitchView(item.id)}
                  />
                ))}
              </nav>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
