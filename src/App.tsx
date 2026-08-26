import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MainDashboard } from './components/dashboard/MainDashboard';
import { LeadDirectory } from './components/leads/LeadDirectory';
import { AILeadGenerator } from './components/leads/AILeadGenerator';
import { SmartInbox } from './components/inbox/SmartInbox';
import { CampaignManager } from './components/campaigns/CampaignManager';
import { TemplateManager } from './components/templates/TemplateManager';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SMTPManager } from './components/smtp/SMTPManager';
import { SentMailsTracker } from './components/sent/SentMailsTracker';
import { GeminiAssistant } from './components/ai/GeminiAssistant';
import { OwnerPanel } from './components/owner/OwnerPanel';
import { TrashManager } from './components/trash/TrashManager';
import { AuthModal } from './components/auth/AuthModal';
import { SendMailModal } from './components/mail/SendMailModal';
import { Lead } from './types';
import { 
  LayoutDashboard,
  Users, 
  Sparkles, 
  Inbox, 
  Send, 
  Server, 
  FileText,
  BarChart3,
  Bot, 
  ShieldCheck, 
  Trash2,
  MailCheck
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, threads, currentUser } = useApp();
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isSendMailOpen, setIsSendMailOpen] = useState<boolean>(false);
  const [selectedLeadForMail, setSelectedLeadForMail] = useState<Lead | undefined>(undefined);

  const unreadCount = threads.filter(t => !t.isTrash && t.unreadCount > 0).length;

  const handleOpenSendMail = (lead?: Lead) => {
    setSelectedLeadForMail(lead);
    setIsSendMailOpen(true);
  };

  // Helper to render locked service view if customer's permission is turned off by Owner
  const renderRestrictedServiceView = (serviceName: string, serviceIcon: React.ReactNode) => (
    <div className="p-6 md:p-12 max-w-2xl mx-auto text-center space-y-6 animate-in fade-in">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-950/50">
        {serviceIcon}
      </div>
      <div className="space-y-2">
        <span className="px-3 py-1 text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-full">
          🔒 Service Disabled by Workspace Owner
        </span>
        <h2 className="text-2xl font-black text-slate-100 mt-3">{serviceName} Access Restricted</h2>
        <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
          The Workspace Owner has disabled <strong>{serviceName}</strong> for your account (<code className="text-cyan-300">{currentUser.email}</code>). 
          Please contact your administrator or upgrade your subscription plan to restore access.
        </p>
      </div>

      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-slate-300 max-w-md mx-auto space-y-2 text-left">
        <div className="font-bold text-slate-200 flex items-center gap-2">
          <span>Current Account Plan:</span>
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-extrabold uppercase">
            {currentUser.plan} Tier
          </span>
        </div>
        <div className="text-slate-400 text-[11px]">
          Status: <span className="text-rose-400 font-bold">{currentUser.permissions?.accountStatus === 'suspended' ? 'Account Suspended' : 'Feature Restricted'}</span>
        </div>
      </div>

      <button
        onClick={() => setActiveTab('dashboard')}
        className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
      >
        &larr; Return to Dashboard
      </button>
    </div>
  );

  const renderActiveView = () => {
    // Check if account is suspended
    if (currentUser.role === 'customer' && currentUser.permissions?.accountStatus === 'suspended') {
      return renderRestrictedServiceView('Entire Account', <ShieldCheck className="w-10 h-10" />);
    }

    // Check specific module permissions for customers
    if (currentUser.role === 'customer') {
      if (activeTab === 'generator' && currentUser.permissions?.leadMinerEnabled === false) {
        return renderRestrictedServiceView('AI Lead Miner', <Sparkles className="w-10 h-10" />);
      }
      if (activeTab === 'inbox' && currentUser.permissions?.smartInboxEnabled === false) {
        return renderRestrictedServiceView('Smart Unified Inbox', <Inbox className="w-10 h-10" />);
      }
      if (activeTab === 'campaigns' && currentUser.permissions?.campaignAutomationEnabled === false) {
        return renderRestrictedServiceView('Campaign Wizard & Sequences', <Send className="w-10 h-10" />);
      }
      if (activeTab === 'smtp' && currentUser.permissions?.smtpRotationEnabled === false) {
        return renderRestrictedServiceView('SMTP / IMAP Hub', <Server className="w-10 h-10" />);
      }
      if (activeTab === 'ai_copilot' && currentUser.permissions?.aiCopilotEnabled === false) {
        return renderRestrictedServiceView('AI Outreach Copilot', <Bot className="w-10 h-10" />);
      }
      if (activeTab === 'templates' && currentUser.permissions?.templatesEnabled === false) {
        return renderRestrictedServiceView('Templates & Anti-Spam Audit', <FileText className="w-10 h-10" />);
      }
      if (activeTab === 'analytics' && currentUser.permissions?.analyticsEnabled === false) {
        return renderRestrictedServiceView('Deliverability Radar', <BarChart3 className="w-10 h-10" />);
      }
    }

    switch (activeTab) {
      case 'dashboard':
        return <MainDashboard onOpenSendMail={() => handleOpenSendMail()} />;
      case 'leads':
        return <LeadDirectory onOpenSendMail={(lead) => handleOpenSendMail(lead)} />;
      case 'generator':
        return <AILeadGenerator />;
      case 'inbox':
        return <SmartInbox />;
      case 'sent':
      case 'outbox':
        return <SentMailsTracker />;
      case 'campaigns':
        return <CampaignManager />;
      case 'templates':
        return <TemplateManager />;
      case 'analytics':
        return <AnalyticsView />;
      case 'smtp':
        return <SMTPManager />;
      case 'ai_copilot':
        return <GeminiAssistant />;
      case 'owner':
        return <OwnerPanel />;
      case 'trash':
        return <TrashManager />;
      default:
        return <MainDashboard onOpenSendMail={() => handleOpenSendMail()} />;
    }
  };

  return (
    <div className="h-screen w-full bg-[#080c14] text-slate-100 flex flex-col overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar 
        onOpenAuth={() => setIsAuthOpen(true)} 
        onOpenSendMail={() => handleOpenSendMail()} 
      />

      {/* Body Layout: Sidebar + Main Content View */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <Sidebar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-20 md:pb-6">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Responsive Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-lg border-t border-slate-800 flex items-center justify-around px-2 py-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold p-1 rounded-lg transition ${
            activeTab === 'dashboard' ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold p-1 rounded-lg transition ${
            activeTab === 'leads' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Leads</span>
        </button>

        <button
          onClick={() => setActiveTab('generator')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold p-1 rounded-lg transition ${
            activeTab === 'generator' ? 'text-purple-400' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Miner</span>
        </button>

        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold p-1 rounded-lg transition relative ${
            activeTab === 'inbox' ? 'text-rose-400' : 'text-slate-400'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Inbox</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold p-1 rounded-lg transition ${
            activeTab === 'campaigns' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Campaigns</span>
        </button>

        <button
          onClick={() => setActiveTab('owner')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold p-1 rounded-lg transition ${
            activeTab === 'owner' ? 'text-indigo-400' : 'text-slate-400'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Owner</span>
        </button>
      </nav>

      {/* Auth Modal (Dual Client/Owner Portal with Eye visibility toggles & password confirmation) */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Send Mail Cold Outreach Modal (Anti-spam score + signature auto-embed + scheduling) */}
      <SendMailModal 
        isOpen={isSendMailOpen} 
        onClose={() => {
          setIsSendMailOpen(false);
          setSelectedLeadForMail(undefined);
        }} 
        initialLead={selectedLeadForMail}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
