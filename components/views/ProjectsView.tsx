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
    className="bg-gradient-to-br from-[#1e232e] to-[#161a22] border border-[var(--border)] rounded-2xl p-5 cursor-pointer group hover:border-teal-500/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-teal-900/20 relative overflow-hidden"
  >
    <div className="flex flex-col h-full">
      <div className="text-4xl mb-4">{template.icon}</div>
      <div className="font-semibold text-white text-lg">{template.name}</div>
      <div className="text-sm text-[var(--muted)] mt-1 flex-grow">{template.description}</div>
      <button 
        onClick={(e) => { e.stopPropagation(); onSelect(template); }}
        className="mt-6 w-full text-center text-sm font-semibold bg-white/5 border border-white/10 px-4 py-2.5 rounded-lg hover:bg-white/10 group-hover:bg-teal-500/10 group-hover:border-teal-500/30 group-hover:text-teal-300 transition-colors duration-300"
      >
        Try Agent <i className="fas fa-arrow-right ml-2 opacity-70 group-hover:translate-x-1 transition-transform"></i>
      </button>
    </div>
    <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
