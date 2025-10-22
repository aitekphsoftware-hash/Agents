
import React from 'react';
import { Template } from '../../types';
import { TEMPLATES } from '../../constants';

interface ProjectsViewProps {
  onSelectTemplate: (template: Template) => void;
}

const KPICard: React.FC<{ title: string; value: string; gradient: string }> = ({ title, value, gradient }) => (
  <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-lg">
    <div className="text-sm text-[var(--muted)] mb-2">{title}</div>
    <div className="text-4xl font-bold text-white">{value}</div>
    <div className={`mt-4 h-2 rounded-full ${gradient} opacity-75`}></div>
  </div>
);

const TemplateCard: React.FC<{ template: Template; onSelect: (template: Template) => void }> = ({ template, onSelect }) => (
  <div 
    onClick={() => onSelect(template)}
    className="bg-[#1a1e25] border border-[var(--border)] rounded-xl p-4 cursor-pointer group hover:border-[var(--teal)]/50 transition-all duration-300 transform hover:-translate-y-1"
  >
    <div className="text-3xl mb-2">{template.icon}</div>
    <div className="font-semibold text-white">{template.name}</div>
    <div className="text-xs text-[var(--muted)] mt-1">{template.description}</div>
    <div className="mt-4 flex items-center justify-between">
      <button 
        onClick={(e) => { e.stopPropagation(); alert(`Previewing voice for ${template.name}`); }} 
        className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors"
      >
        Preview Voice
      </button>
      <button 
        onClick={() => onSelect(template)}
        className="text-xs bg-gradient-to-r from-[rgba(25,194,255,.16)] to-[rgba(246,196,83,.16)] text-white px-3 py-1.5 rounded-md border border-teal-500/30 group-hover:scale-105 transition-transform"
      >
        Try Now
      </button>
    </div>
  </div>
);


export const ProjectsView: React.FC<ProjectsViewProps> = ({ onSelectTemplate }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard title="Calls Handled (Today)" value="128" gradient="bg-gradient-to-r from-teal-500 to-cyan-400" />
        <KPICard title="Avg. Turn Latency" value="0.82s" gradient="bg-gradient-to-r from-blue-500 to-indigo-400" />
        <KPICard title="CSAT (Demo)" value="94%" gradient="bg-gradient-to-r from-amber-400 to-orange-400" />
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-5">
            <div>
            <h2 className="text-lg font-semibold text-white">CSR Agent Templates</h2>
            <p className="text-sm text-[var(--muted)]">Select a pre-configured agent to start a conversation.</p>
            </div>
            <button className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors">
                <i className="fas fa-plus mr-2"></i> Create New
            </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {TEMPLATES.map(template => (
            <TemplateCard key={template.id} template={template} onSelect={onSelectTemplate} />
          ))}
        </div>
      </div>
    </div>
  );
};
