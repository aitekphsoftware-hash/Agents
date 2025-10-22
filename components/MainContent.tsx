
import React from 'react';
import { View, Template } from '../types';
import { ProjectsView } from './views/ProjectsView';
import { PlaceholderView } from './views/PlaceholderView';

interface MainContentProps {
  activeView: View;
  onSelectTemplate: (template: Template) => void;
}

export const MainContent: React.FC<MainContentProps> = ({ activeView, onSelectTemplate }) => {
  return (
    <main className="space-y-6">
      {activeView === 'projects' && <ProjectsView onSelectTemplate={onSelectTemplate} />}
      {activeView === 'agents' && <PlaceholderView title="Agents" />}
      {activeView === 'knowledge' && <PlaceholderView title="Knowledge Base" />}
      {activeView === 'models' && <PlaceholderView title="Language Models" />}
      {activeView === 'voices' && <PlaceholderView title="Voices" />}
    </main>
  );
};
