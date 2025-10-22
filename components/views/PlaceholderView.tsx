
import React from 'react';

interface PlaceholderViewProps {
  title: string;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title }) => {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-10 text-center min-h-[400px] flex flex-col justify-center items-center">
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-[var(--muted)]">This feature is currently under development.</p>
      <div className="mt-6 w-24 h-1 bg-white/10 rounded-full"></div>
    </div>
  );
};
