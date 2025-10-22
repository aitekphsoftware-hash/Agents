
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { Dialer } from './components/Dialer';
import { Template, View } from './types';
import { TEMPLATES } from './constants';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('projects');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0]);
  const [isDialerFocused, setDialerFocused] = useState(false);

  const handleSwitchView = useCallback((view: View) => {
    setActiveView(view);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  const handleSelectTemplate = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setDialerFocused(true); 
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };
  
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header onMenuClick={toggleSidebar} />
      <div className="max-w-screen-2xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_380px] gap-6">
        <Sidebar activeView={activeView} onSwitchView={handleSwitchView} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        <MainContent activeView={activeView} onSelectTemplate={handleSelectTemplate} />
        <div className="hidden xl:block">
          <Dialer selectedTemplate={selectedTemplate} isFocused={isDialerFocused} />
        </div>
      </div>
       {/* Mobile Dialer Modal */}
       {isDialerFocused && (
        <div className="xl:hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setDialerFocused(false)}>
           <div className="w-[90vw] max-w-sm h-[90vh] max-h-[700px]" onClick={e => e.stopPropagation()}>
             <Dialer selectedTemplate={selectedTemplate} isFocused={true} isMobile={true}/>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
