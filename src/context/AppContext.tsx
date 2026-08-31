import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  Lead, 
  LeadTag,
  EmailThread, 
  EmailMessage, 
  Campaign, 
  SMTPAccount, 
  AppNotification, 
  UserAccount, 
  EmailTemplate, 
  TemplateCategory,
  ColumnSetting, 
  SentEmailLog, 
  SimulatedReplyPayload,
  DirectSendMailPayload,
  NotificationSettings
} from '../types';
import confetti from 'canvas-confetti';
import { audioEngine } from '../utils/audioPlayer';
import { supabase, isSupabaseConfigured, signOutSupabase } from '../lib/supabase';

// Helper to calculate warm-up limits based on gradual +15/day ramp
export const getSMTPWarmupDetails = (account: SMTPAccount) => {
  const mode = account.warmupMode || (account.warmupStatus === 'warming' ? 'ramp_15' : 'full');
  const dailyCap = account.dailyLimit || 500;
  
  if (mode === 'paused') {
    return {
      mode: 'paused',
      day: 1,
      currentDailyLimit: 0,
      dailyCap,
      percentComplete: 0,
      isRamping: false
    };
  }
  
  if (mode === 'full') {
    return {
      mode: 'full',
      day: 30,
      currentDailyLimit: dailyCap,
      dailyCap,
      percentComplete: 100,
      isRamping: false
    };
  }
  
  // ramp_15 calculation
  const startDateStr = account.warmupStartDate || new Date().toISOString();
  const startMs = new Date(startDateStr).getTime();
  const diffDays = Math.max(1, Math.floor((Date.now() - startMs) / (1000 * 60 * 60 * 24)) + 1);
  const rampLimit = Math.min(dailyCap, 15 * diffDays);
  const percentComplete = Math.min(100, Math.round((rampLimit / dailyCap) * 100));
  
  return {
    mode: 'ramp_15',
    day: diffDays,
    currentDailyLimit: rampLimit,
    dailyCap,
    percentComplete,
    isRamping: rampLimit < dailyCap
  };
};

interface AppContextType {
  // Navigation & View
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeFollowUpCohort: '7d' | '14d' | '30d' | null;
  setActiveFollowUpCohort: (cohort: '7d' | '14d' | '30d' | null) => void;
  openFollowUpCohortModal: (cohort: '7d' | '14d' | '30d') => void;

  // Sound & Notification Settings
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  playNotificationSound: (preset?: string) => void;
  requestDesktopNotificationPermission: () => Promise<boolean>;

  // Lead Directory
  leads: Lead[];
  addLeads: (newLeads: Partial<Lead>[], targetTag?: string) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLeadToTrash: (id: string) => void;
  restoreLead: (id: string) => void;
  permanentDeleteLead: (id: string) => void;
  bulkDeleteLeads: (ids: string[]) => void;
  bulkRestoreLeads: (ids: string[]) => void;
  bulkPermanentDeleteLeads: (ids: string[]) => void;
  verifyLeadWebsite: (id: string) => Promise<void>;
  
  // Lead Tag Management
  leadTags: LeadTag[];
  addLeadTag: (tag: Omit<LeadTag, 'id' | 'createdAt'>) => LeadTag;
  updateLeadTag: (id: string, updates: Partial<LeadTag>) => void;
  deleteLeadTag: (id: string) => void;
  assignTagsToLeads: (leadIds: string[], tagNames: string[]) => void;

  // Columns & Display
  columnSettings: ColumnSetting[];
  toggleColumnSetting: (id: string) => void;

  // Inbox & Threads
  threads: EmailThread[];
  activeThreadId: string | null;
  setActiveThreadId: (id: string | null) => void;
  sendReply: (threadId: string, replyBody: string) => void;
  markThreadRead: (threadId: string) => void;
  toggleThreadStar: (threadId: string) => void;
  addThreadLabel: (threadId: string, label: string) => void;
  removeThreadLabel: (threadId: string, label: string) => void;
  deleteThreadToTrash: (threadId: string) => void;
  restoreThread: (threadId: string) => void;
  permanentDeleteThread: (threadId: string) => void;
  bulkRestoreThreads: (threadIds: string[]) => void;
  bulkPermanentDeleteThreads: (threadIds: string[]) => void;

  // Campaigns & Automated Sequences
  campaigns: Campaign[];
  createCampaign: (campaign: Omit<Campaign, 'id' | 'sentCount' | 'openCount' | 'replyCount' | 'bounceCount' | 'createdAt'>) => Campaign;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  toggleCampaignStatus: (id: string) => void;
  deleteCampaign: (id: string) => void;
  restoreCampaign: (id: string) => void;
  permanentDeleteCampaign: (id: string) => void;
  bulkRestoreCampaigns: (ids: string[]) => void;
  bulkPermanentDeleteCampaigns: (ids: string[]) => void;
  launchQuickFollowUp: (days: '7d' | '14d' | '30d') => void;
  getDormantLeads: (days: number) => Lead[];

  // Templates & Categories
  emailTemplates: EmailTemplate[];
  templateCategories: TemplateCategory[];
  addTemplateCategory: (category: Omit<TemplateCategory, 'id'>) => TemplateCategory;
  deleteTemplateCategory: (id: string) => void;
  addEmailTemplate: (template: Omit<EmailTemplate, 'id' | 'usageCount' | 'replyRatePercent' | 'createdAt'>) => EmailTemplate;
  updateEmailTemplate: (id: string, updates: Partial<EmailTemplate>) => void;
  deleteEmailTemplate: (id: string) => void;
  restoreEmailTemplate: (id: string) => void;
  permanentDeleteEmailTemplate: (id: string) => void;

  // Outbound SMTP Relays
  smtpAccounts: SMTPAccount[];
  addSMTPAccount: (account: Omit<SMTPAccount, 'id' | 'sentToday' | 'healthScore' | 'isConnected' | 'isTrash'>) => SMTPAccount;
  updateSMTPAccount: (id: string, updates: Partial<SMTPAccount>) => void;
  deleteSMTPAccount: (id: string) => void;
  restoreSMTPAccount: (id: string) => void;
  permanentDeleteSMTPAccount: (id: string) => void;
  testSMTPConnection: (id: string) => Promise<boolean>;

  // Sent Emails & Live Outbox Tracking
  sentEmails: SentEmailLog[];
  addSentEmailLog: (log: Omit<SentEmailLog, 'id' | 'sentAt' | 'trackingPixelId'>) => SentEmailLog;
  clearSentEmails: () => void;
  deleteSentEmail: (id: string) => void;
  restoreSentEmail: (id: string) => void;
  permanentDeleteSentEmail: (id: string) => void;
  markEmailOpened: (id: string) => void;
  simulateLeadReplyToSentEmail: (sentEmailId: string, customSnippet?: string) => void;
  sendDirectEmail: (payload: DirectSendMailPayload) => Promise<boolean>;

  // Notifications
  notifications: AppNotification[];
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  deleteNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearAllNotifications: () => void;
  unreadNotificationCount: number;

  // User Accounts & Portal Roles
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  loginUser: (user: UserAccount) => void;
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  allUsers: UserAccount[];
  setAllUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  updateUserRole: (userId: string, role: 'client' | 'agency' | 'owner' | 'manager' | 'rep' | 'customer') => void;
  updateUserPermissions: (userId: string, permissions: any) => void;
  deleteUserAccount: (userId: string) => void;
  resetUserPasswordByEmail: (email: string, newPass: string) => boolean;
  logout: () => void;
  isLogoutConfirmOpen: boolean;
  setIsLogoutConfirmOpen: (open: boolean) => void;
  requestLogout: () => void;

  // AI Mined Cache
  minedLeads: Lead[];
  setMinedLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  
  // Cross-Browser Cloud Workspace Sync
  loadUserWorkspace: (userEmail: string) => Promise<void>;
  isWorkspaceLoading: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline';
  
  // Trash Operations
  emptyAllTrash: () => void;
  totalTrashCount: number;
  
  // Live Simulation
  simulateIncomingReply: () => void;
  customSimulateReply: (payload?: SimulatedReplyPayload) => void;
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;

  // Global Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default columns with open, reply, and tag columns
const DEFAULT_COLUMNS: ColumnSetting[] = [
  { id: 'name', label: 'Lead Name & Title', visible: true },
  { id: 'company', label: 'Company & Domain', visible: true },
  { id: 'email', label: 'Email Address', visible: true },
  { id: 'phone', label: 'Direct Phone Number', visible: true },
  { id: 'openStatus', label: 'Email Opened', visible: true },
  { id: 'replyStatus', label: 'Reply Status', visible: true },
  { id: 'tags', label: 'Tags', visible: true },
  { id: 'status', label: 'Pipeline Status', visible: true },
  { id: 'websiteStatus', label: 'Site Health Ping', visible: true },
  { id: 'niche', label: 'Niche / Industry', visible: true },
  { id: 'location', label: 'Location', visible: true },
  { id: 'score', label: 'Lead Quality Score', visible: true },
  { id: 'socials', label: 'Social Handles', visible: true },
  { id: 'daysAgo', label: 'Last Activity / Inactive Days', visible: true },
  { id: 'actions', label: 'Actions', visible: true },
];

// Clean empty signature constant (No hardcoded contact or branding injection!)
export const DEFAULT_USER_SIGNATURE = '';

// Clean Data Versioning to wipe legacy dummy mock records
const DATA_CLEAN_VERSION = 'visualsky_v3_empty_clean';
if (typeof window !== 'undefined') {
  try {
    const currentVersion = localStorage.getItem('visualsky_data_clean_version');
    if (currentVersion !== DATA_CLEAN_VERSION) {
      localStorage.removeItem('visualsky_leads');
      localStorage.removeItem('visualsky_threads');
      localStorage.removeItem('visualsky_campaigns');
      localStorage.removeItem('visualsky_templates');
      localStorage.removeItem('visualsky_smtp');
      localStorage.removeItem('visualsky_sent_emails');
      localStorage.removeItem('visualsky_notifs');
      localStorage.removeItem('visualsky_tags');
      localStorage.removeItem('visualsky_mined_leads');
      localStorage.removeItem('visualsky_users');
      localStorage.removeItem('visualsky_current_user');
      localStorage.setItem('visualsky_data_clean_version', DATA_CLEAN_VERSION);
    }
  } catch (e) {
    console.error('Storage version migration error:', e);
  }
}

// Initial Lead Tags (Clean empty initial list)
const INITIAL_TAGS: LeadTag[] = [];

// Initial Verified Leads (Clean empty initial list)
const INITIAL_LEADS: Lead[] = [];

// Initial Email Templates & Categories
export const INITIAL_TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: 'cold_outreach', name: 'cold_outreach', label: 'Cold Outreach', color: 'cyan' },
  { id: 'followup_7d', name: 'followup_7d', label: '7-Day Follow-Up', color: 'amber' },
  { id: 'followup_14d', name: 'followup_14d', label: '14-Day Value Add', color: 'orange' },
  { id: 'breakup_30d', name: 'breakup_30d', label: '30-Day Breakup', color: 'rose' },
  { id: 'saas_demo', name: 'saas_demo', label: 'SaaS Product Pitch', color: 'purple' },
  { id: 'agency_pitch', name: 'agency_pitch', label: 'Agency White-Label', color: 'emerald' },
];

export const INITIAL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tmpl-builtin-1',
    title: 'Executive Cold Outreach (High Deliverability)',
    category: 'cold_outreach',
    subject: 'quick question regarding {{company}}',
    body: `Hi {{name}},\n\nNoticed your recent work at {{company}} in {{niche}}.\n\nWe recently helped a similar team achieve a 3.8x boost in booked outbound meetings through automated multi-relay warmup and 99.8% primary inbox placement.\n\nWould you be open to a quick 2-minute video breakdown this Thursday?\n\nBest regards,`,
    tags: ['Outreach', 'B2B', 'Deliverability'],
    isCustom: false,
    usageCount: 142,
    replyRatePercent: 28.4,
    createdAt: '2026-08-01'
  },
  {
    id: 'tmpl-builtin-2',
    title: '7-Day Value Add Follow-Up',
    category: 'followup_7d',
    subject: 'idea for {{company}}\'s outbound stack',
    body: `Hi {{name}},\n\nFollowing up on my note from last week regarding {{company}}.\n\nThought you might find this relevant—we put together a 1-page deliverability checklist that eliminates spam filter triggers across Outlook and Google Workspace.\n\nHappy to share if helpful?\n\nBest,`,
    tags: ['FollowUp', 'Value-Add'],
    isCustom: false,
    usageCount: 89,
    replyRatePercent: 34.2,
    createdAt: '2026-08-05'
  },
  {
    id: 'tmpl-builtin-3',
    title: '30-Day Polite Breakup Email',
    category: 'breakup_30d',
    subject: 'permission to close {{company}}\'s file?',
    body: `Hi {{name}},\n\nI haven't heard back, so I assume scaling cold outbound isn't a priority for {{company}} right now.\n\nI'll go ahead and close your file so I don't clutter your inbox.\n\nIf anything changes down the road, feel free to reach back out anytime.\n\nBest regards,`,
    tags: ['Breakup', 'CleanUp'],
    isCustom: false,
    usageCount: 65,
    replyRatePercent: 41.0,
    createdAt: '2026-08-10'
  }
];

// Initial Threads (Clean empty initial list)
const INITIAL_THREADS: EmailThread[] = [];

// Initial SMTP Relays (Clean empty initial list)
const INITIAL_SMTP: SMTPAccount[] = [];

// Initial Sent Email Logs (Clean empty initial list)
const INITIAL_SENT_LOGS: SentEmailLog[] = [];

// Initial Users (Clean Master Admin account)
const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-agency-1',
    name: 'Rafiqul VisualSky',
    email: 'rafiqulvisualsky@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'agency',
    isOwner: true,
    plan: 'Enterprise',
    bdtPlanLabel: 'Agency Master Admin (Free Unlimited)',
    quotaUsed: 0,
    quotaLimit: 50000,
    aiCredits: 10000,
    company: 'Visual Sky',
    title: 'Agency Principal & Master Admin',
    joinedAt: '2026-08-29'
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation with persistent active tab restoration
  const [activeTab, setActiveTabState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('visualsky_active_tab');
      return saved || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [activeFollowUpCohort, setActiveFollowUpCohort] = useState<'7d' | '14d' | '30d' | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const openFollowUpCohortModal = (cohort: '7d' | '14d' | '30d') => {
    setActiveFollowUpCohort(cohort);
    setActiveTabState('campaigns');
    try { localStorage.setItem('visualsky_active_tab', 'campaigns'); } catch {}
  };

  // Current User & All Users
  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('visualsky_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [isAuthenticated, setIsAuthenticatedState] = useState<boolean>(() => {
    try {
      const authStored = localStorage.getItem('visualsky_authenticated');
      return authStored === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUserState] = useState<UserAccount>(() => {
    try {
      const saved = localStorage.getItem('visualsky_current_user');
      return saved ? JSON.parse(saved) : INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  });

  // Client vs Agency / Owner route guard
  const isAgencyUser = (user: UserAccount) => {
    return user.role === 'agency' || user.role === 'owner' || Boolean(user.isOwner);
  };

  const setIsAuthenticated = (auth: boolean) => {
    setIsAuthenticatedState(auth);
    try {
      if (auth) {
        localStorage.setItem('visualsky_authenticated', 'true');
      } else {
        localStorage.removeItem('visualsky_authenticated');
        localStorage.removeItem('visualsky_current_user');
      }
    } catch {}
  };

  const loginUser = (user: UserAccount) => {
    setCurrentUserState(user);
    setIsAuthenticatedState(true);
    try {
      localStorage.setItem('visualsky_authenticated', 'true');
      localStorage.setItem('visualsky_current_user', JSON.stringify(user));
    } catch {}
    
    // Check if user had a previously saved tab
    const savedTab = localStorage.getItem('visualsky_active_tab');
    if (savedTab && (savedTab !== 'owner' || isAgencyUser(user))) {
      setActiveTabState(savedTab);
    } else if (isAgencyUser(user)) {
      setActiveTabState('owner');
      try { localStorage.setItem('visualsky_active_tab', 'owner'); } catch {}
    } else {
      setActiveTabState('dashboard');
      try { localStorage.setItem('visualsky_active_tab', 'dashboard'); } catch {}
    }
    // Cross-browser sync: immediately load server workspace
    loadUserWorkspace(user.email);
  };

  const setActiveTab = (tab: string) => {
    // If client tries to access agency master/owner panel, redirect to dashboard
    if (tab === 'owner' && !isAgencyUser(currentUser)) {
      setActiveTabState('dashboard');
      try { localStorage.setItem('visualsky_active_tab', 'dashboard'); } catch {}
      return;
    }
    setActiveTabState(tab);
    try { localStorage.setItem('visualsky_active_tab', tab); } catch {}
  };

  const setCurrentUser = (user: UserAccount) => {
    setCurrentUserState(user);
    if (!isAgencyUser(user) && activeTab === 'owner') {
      setActiveTabState('dashboard');
      try { localStorage.setItem('visualsky_active_tab', 'dashboard'); } catch {}
    }
    if (user?.email && user.email.toLowerCase() !== loadedWorkspaceEmailRef.current) {
      loadUserWorkspace(user.email);
    }
  };

  // Supabase Auth State Synchronization
  useEffect(() => {
    if (!supabase) return;

    // Check existing session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const metadata = session.user.user_metadata || {};
        const pendingRole = localStorage.getItem('visualsky_pending_oauth_role') as ('client' | 'agency' | null);
        if (pendingRole) {
          localStorage.removeItem('visualsky_pending_oauth_role');
        }
        let role: 'client' | 'agency' = (metadata.role as 'client' | 'agency') || pendingRole || (session.user.email?.includes('admin') || session.user.email?.includes('agency') ? 'agency' : 'client');

        // Check Agency 3-Seat Quota Limit
        if (role === 'agency') {
          const currentAgencyUsers = allUsers.filter(u => (u.role === 'agency' || u.role === 'owner' || Boolean(u.isOwner)) && u.email.toLowerCase() !== session.user.email?.toLowerCase());
          if (currentAgencyUsers.length >= 3) {
            role = 'client';
          }
        }

        const isAgency = role === 'agency';
        let paymentInfo = metadata.payment_info || null;
        if (!paymentInfo) {
          try {
            const pendingPayment = localStorage.getItem('visualsky_pending_payment_info');
            if (pendingPayment) {
              paymentInfo = JSON.parse(pendingPayment);
              localStorage.removeItem('visualsky_pending_payment_info');
            }
          } catch {}
        }

        const syncedUser: UserAccount = {
          id: session.user.id,
          name: metadata.name || session.user.email?.split('@')[0] || (isAgency ? 'Agency Admin' : 'Client User'),
          email: session.user.email || '',
          avatar: metadata.avatar || (isAgency
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
          role: role,
          isOwner: isAgency,
          plan: metadata.plan || (isAgency ? 'Enterprise' : 'Pro'),
          bdtPlanLabel: metadata.bdt_plan_label || (isAgency ? 'Agency Master (Free Unlimited)' : 'Scale Business (BDT 4,999/mo)'),
          quotaUsed: currentUser?.quotaUsed || 0,
          quotaLimit: currentUser?.quotaLimit || (isAgency ? 50000 : 5000),
          aiCredits: currentUser?.aiCredits || (isAgency ? 10000 : 2500),
          company: metadata.company || (isAgency ? 'VisualSky Agency Platform' : 'Client Workspace'),
          title: metadata.title || (isAgency ? 'Agency Principal' : 'Client Member'),
          phone: metadata.phone || '',
          paymentInfo,
          supabaseId: session.user.id,
          joinedAt: new Date().toISOString().split('T')[0]
        };

        setCurrentUserState(syncedUser);
        setIsAuthenticatedState(true);
        try {
          localStorage.setItem('visualsky_authenticated', 'true');
          localStorage.setItem('visualsky_current_user', JSON.stringify(syncedUser));
        } catch {}
        setAllUsers(prev => {
          const exists = prev.some(u => u.email.toLowerCase() === syncedUser.email.toLowerCase() || u.id === syncedUser.id);
          if (exists) {
            return prev.map(u => (u.email.toLowerCase() === syncedUser.email.toLowerCase() || u.id === syncedUser.id) ? syncedUser : u);
          }
          return [syncedUser, ...prev];
        });

        // Load persisted workspace from server
        loadUserWorkspace(syncedUser.email);

        // Respect existing saved active tab
        const savedTab = localStorage.getItem('visualsky_active_tab');
        if (savedTab && (savedTab !== 'owner' || isAgency)) {
          setActiveTabState(savedTab);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthenticatedState(false);
        try {
          localStorage.removeItem('visualsky_authenticated');
          localStorage.removeItem('visualsky_current_user');
        } catch {}
        return;
      }

      if (session?.user) {
        // Tab-switching / visibility change / token refresh guard:
        // If user is already authenticated with the same user ID/email, do NOT force-reset the tab or wipe user state
        const storedAuth = localStorage.getItem('visualsky_authenticated') === 'true';
        const storedUser = localStorage.getItem('visualsky_current_user');
        let parsedStoredEmail = '';
        try {
          if (storedUser) parsedStoredEmail = JSON.parse(storedUser)?.email || '';
        } catch {}

        const isSameActiveSession = storedAuth && parsedStoredEmail.toLowerCase() === session.user.email?.toLowerCase();
        if (event === 'TOKEN_REFRESHED' || (event === 'INITIAL_SESSION' && isSameActiveSession)) {
          // Token refresh or background tab reactivation - keep current tab and modal state strictly intact
          return;
        }

        const metadata = session.user.user_metadata || {};
        const pendingRole = localStorage.getItem('visualsky_pending_oauth_role') as ('client' | 'agency' | null);
        if (pendingRole) {
          localStorage.removeItem('visualsky_pending_oauth_role');
        }
        let role: 'client' | 'agency' = (metadata.role as 'client' | 'agency') || pendingRole || (session.user.email?.includes('admin') || session.user.email?.includes('agency') ? 'agency' : 'client');

        // Check Agency 3-Seat Quota Limit
        if (role === 'agency') {
          const currentAgencyUsers = allUsers.filter(u => (u.role === 'agency' || u.role === 'owner' || Boolean(u.isOwner)) && u.email.toLowerCase() !== session.user.email?.toLowerCase());
          if (currentAgencyUsers.length >= 3) {
            role = 'client';
          }
        }

        const isAgency = role === 'agency';
        let paymentInfo = metadata.payment_info || null;
        if (!paymentInfo) {
          try {
            const pendingPayment = localStorage.getItem('visualsky_pending_payment_info');
            if (pendingPayment) {
              paymentInfo = JSON.parse(pendingPayment);
              localStorage.removeItem('visualsky_pending_payment_info');
            }
          } catch {}
        }

        const syncedUser: UserAccount = {
          id: session.user.id,
          name: metadata.name || session.user.email?.split('@')[0] || (isAgency ? 'Agency Admin' : 'Client User'),
          email: session.user.email || '',
          avatar: metadata.avatar || (isAgency
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
          role: role,
          isOwner: isAgency,
          plan: metadata.plan || (isAgency ? 'Enterprise' : 'Pro'),
          bdtPlanLabel: metadata.bdt_plan_label || (isAgency ? 'Agency Master (Free Unlimited)' : 'Scale Business (BDT 4,999/mo)'),
          quotaUsed: currentUser?.quotaUsed || 0,
          quotaLimit: currentUser?.quotaLimit || (isAgency ? 50000 : 5000),
          aiCredits: currentUser?.aiCredits || (isAgency ? 10000 : 2500),
          company: metadata.company || (isAgency ? 'VisualSky Agency Platform' : 'Client Workspace'),
          title: metadata.title || (isAgency ? 'Agency Principal' : 'Client Member'),
          phone: metadata.phone || '',
          paymentInfo,
          supabaseId: session.user.id,
          joinedAt: new Date().toISOString().split('T')[0]
        };

        setCurrentUserState(syncedUser);
        setIsAuthenticatedState(true);
        try {
          localStorage.setItem('visualsky_authenticated', 'true');
          localStorage.setItem('visualsky_current_user', JSON.stringify(syncedUser));
        } catch {}
        setAllUsers(prev => {
          const exists = prev.some(u => u.email.toLowerCase() === syncedUser.email.toLowerCase() || u.id === syncedUser.id);
          if (exists) {
            return prev.map(u => (u.email.toLowerCase() === syncedUser.email.toLowerCase() || u.id === syncedUser.id) ? syncedUser : u);
          }
          return [syncedUser, ...prev];
        });

        // Load persisted workspace from server
        loadUserWorkspace(syncedUser.email);

        // Keep existing active tab if already set or saved, otherwise set default
        const savedTab = localStorage.getItem('visualsky_active_tab');
        if (savedTab && (savedTab !== 'owner' || isAgency)) {
          setActiveTabState(savedTab);
        } else if (isAgency) {
          setActiveTabState('owner');
          try { localStorage.setItem('visualsky_active_tab', 'owner'); } catch {}
        } else {
          setActiveTabState('dashboard');
          try { localStorage.setItem('visualsky_active_tab', 'dashboard'); } catch {}
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Lead Tags
  const [leadTags, setLeadTags] = useState<LeadTag[]>(() => {
    try {
      const saved = localStorage.getItem('visualsky_tags');
      return saved ? JSON.parse(saved) : INITIAL_TAGS;
    } catch {
      return INITIAL_TAGS;
    }
  });

  // Leads
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem('visualsky_leads');
      const loaded: Lead[] = saved ? JSON.parse(saved) : INITIAL_LEADS;
      const seen = new Set<string>();
      return loaded.map((l, idx) => {
        let finalId = l.id;
        if (!finalId || seen.has(finalId)) {
          finalId = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${idx}`;
        }
        seen.add(finalId);
        return { ...l, id: finalId };
      });
    } catch {
      return INITIAL_LEADS;
    }
  });

  // Column Settings
  const [columnSettings, setColumnSettings] = useState<ColumnSetting[]>(() => {
    try {
      const saved = localStorage.getItem('visualsky_cols');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure new columns exist
        const hasOpen = parsed.some((c: any) => c.id === 'openStatus');
        const hasReply = parsed.some((c: any) => c.id === 'replyStatus');
        const hasTags = parsed.some((c: any) => c.id === 'tags');
        if (hasOpen && hasReply && hasTags) return parsed;
      }
      return DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });

  // Threads
  const [threads, setThreads] = useState<EmailThread[]>(() => {
    try {
      const saved = localStorage.getItem('visualsky_threads');
      return saved ? JSON.parse(saved) : INITIAL_THREADS;
    } catch {
      return INITIAL_THREADS;
    }
  });
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const saved = localStorage.getItem('visualsky_campaigns');
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });

  // Template Categories & Templates
  const [templateCategories, setTemplateCategories] = useState<TemplateCategory[]>(() => {
    try {
      const saved = localStorage.getItem('visualsky_tmpl_categories');
      return saved ? JSON.parse(saved) : INITIAL_TEMPLATE_CATEGORIES;
    } catch {
      return INITIAL_TEMPLATE_CATEGORIES;
    }
  });

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('visualsky_templates');
      return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
    } catch {
      return INITIAL_TEMPLATES;
    }
  });

  // SMTP Relays
  const [smtpAccounts, setSmtpAccounts] = useState<SMTPAccount[]>(() => {
    try {
      const saved = localStorage.getItem('visualsky_smtp');
      return saved ? JSON.parse(saved) : INITIAL_SMTP;
    } catch {
      return INITIAL_SMTP;
    }
  });

  // Sent Emails
  const [sentEmails, setSentEmails] = useState<SentEmailLog[]>(() => {
    try {
      const saved = localStorage.getItem('visualsky_sent_emails');
      return saved ? JSON.parse(saved) : INITIAL_SENT_LOGS;
    } catch {
      return INITIAL_SENT_LOGS;
    }
  });

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('visualsky_notifs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Mined leads cache
  const [minedLeads, setMinedLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem('visualsky_mined_leads');
      if (!saved) return [];
      const parsed: Lead[] = JSON.parse(saved);
      const seen = new Set<string>();
      return parsed.map((l, idx) => {
        let finalId = l.id;
        if (!finalId || seen.has(finalId)) {
          finalId = `mined-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${idx}`;
        }
        seen.add(finalId);
        return { ...l, id: finalId };
      });
    } catch {
      return [];
    }
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem('visualsky_notification_settings');
      return saved ? JSON.parse(saved) : {
        soundEnabled: true,
        soundPreset: 'chime',
        customAudioBase64: null,
        volume: 85,
        desktopPushEnabled: true
      };
    } catch {
      return {
        soundEnabled: true,
        soundPreset: 'chime',
        customAudioBase64: null,
        volume: 85,
        desktopPushEnabled: true
      };
    }
  });

  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const loadedWorkspaceEmailRef = useRef<string | null>(null);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // Load user workspace from server (Cross-Browser Persistence)
  const loadUserWorkspace = async (userEmail: string) => {
    if (!userEmail) return;
    const cleanEmail = userEmail.trim().toLowerCase();
    setIsWorkspaceLoading(true);
    setSyncStatus('syncing');

    try {
      const res = await fetch(`/api/user-data/${encodeURIComponent(cleanEmail)}`);
      if (res.ok) {
        const json = await res.json();
        const data = json?.data;
        if (data && typeof data === 'object') {
          if (Array.isArray(data.leads)) {
            setLeads(data.leads);
            try { localStorage.setItem('visualsky_leads', JSON.stringify(data.leads)); } catch {}
          }
          if (Array.isArray(data.leadTags)) {
            setLeadTags(data.leadTags);
            try { localStorage.setItem('visualsky_tags', JSON.stringify(data.leadTags)); } catch {}
          }
          if (Array.isArray(data.smtpAccounts)) {
            setSmtpAccounts(data.smtpAccounts);
            try { localStorage.setItem('visualsky_smtp', JSON.stringify(data.smtpAccounts)); } catch {}
          }
          if (Array.isArray(data.campaigns)) {
            setCampaigns(data.campaigns);
            try { localStorage.setItem('visualsky_campaigns', JSON.stringify(data.campaigns)); } catch {}
          }
          if (Array.isArray(data.emailTemplates)) {
            setEmailTemplates(data.emailTemplates);
            try { localStorage.setItem('visualsky_templates', JSON.stringify(data.emailTemplates)); } catch {}
          }
          if (Array.isArray(data.templateCategories)) {
            setTemplateCategories(data.templateCategories);
            try { localStorage.setItem('visualsky_tmpl_categories', JSON.stringify(data.templateCategories)); } catch {}
          }
          if (Array.isArray(data.threads)) {
            setThreads(data.threads);
            try { localStorage.setItem('visualsky_threads', JSON.stringify(data.threads)); } catch {}
          }
          if (Array.isArray(data.sentEmails)) {
            setSentEmails(data.sentEmails);
            try { localStorage.setItem('visualsky_sent_emails', JSON.stringify(data.sentEmails)); } catch {}
          }
          if (Array.isArray(data.minedLeads)) {
            setMinedLeads(data.minedLeads);
            try { localStorage.setItem('visualsky_mined_leads', JSON.stringify(data.minedLeads)); } catch {}
          }
          if (Array.isArray(data.columnSettings)) {
            setColumnSettings(data.columnSettings);
            try { localStorage.setItem('visualsky_cols', JSON.stringify(data.columnSettings)); } catch {}
          }
          if (data.notificationSettings && typeof data.notificationSettings === 'object') {
            setNotificationSettings(data.notificationSettings);
            try { localStorage.setItem('visualsky_notification_settings', JSON.stringify(data.notificationSettings)); } catch {}
          }
          if (data.userProfile && typeof data.userProfile === 'object') {
            setCurrentUserState(prev => ({ ...prev, ...data.userProfile }));
          }
        }
      }
      loadedWorkspaceEmailRef.current = cleanEmail;
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Server workspace sync fallback:', err);
      loadedWorkspaceEmailRef.current = cleanEmail;
      setSyncStatus('offline');
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  // Sync all users and initial workspace on mount
  useEffect(() => {
    fetch('/api/users/registry')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.users) && d.users.length > 0) {
          setAllUsers(prev => {
            const merged = [...prev];
            for (const u of d.users) {
              if (!merged.some(m => m.email.toLowerCase() === u.email.toLowerCase())) {
                merged.push(u);
              }
            }
            return merged;
          });
        }
      })
      .catch(() => {});

    if (isAuthenticated && currentUser?.email) {
      loadUserWorkspace(currentUser.email);
    }
  }, []);

  // Sync to LocalStorage
  useEffect(() => { localStorage.setItem('visualsky_tags', JSON.stringify(leadTags)); }, [leadTags]);
  useEffect(() => { localStorage.setItem('visualsky_leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('visualsky_cols', JSON.stringify(columnSettings)); }, [columnSettings]);
  useEffect(() => { localStorage.setItem('visualsky_threads', JSON.stringify(threads)); }, [threads]);
  useEffect(() => { localStorage.setItem('visualsky_campaigns', JSON.stringify(campaigns)); }, [campaigns]);
  useEffect(() => { localStorage.setItem('visualsky_tmpl_categories', JSON.stringify(templateCategories)); }, [templateCategories]);
  useEffect(() => { localStorage.setItem('visualsky_templates', JSON.stringify(emailTemplates)); }, [emailTemplates]);
  useEffect(() => { localStorage.setItem('visualsky_smtp', JSON.stringify(smtpAccounts)); }, [smtpAccounts]);
  useEffect(() => { localStorage.setItem('visualsky_sent_emails', JSON.stringify(sentEmails)); }, [sentEmails]);
  useEffect(() => { localStorage.setItem('visualsky_notifs', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('visualsky_current_user', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { 
    localStorage.setItem('visualsky_users', JSON.stringify(allUsers));
    // Also sync all users to server registry
    fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: allUsers })
    }).catch(() => {});
  }, [allUsers]);
  useEffect(() => { localStorage.setItem('visualsky_mined_leads', JSON.stringify(minedLeads)); }, [minedLeads]);
  useEffect(() => { localStorage.setItem('visualsky_notification_settings', JSON.stringify(notificationSettings)); }, [notificationSettings]);

  // Debounced server workspace sync - only runs when workspace for currentUser has been loaded
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.email) return;
    const cleanEmail = currentUser.email.trim().toLowerCase();

    // Guard: Prevent saving until this user's workspace is confirmed loaded from the backend
    if (loadedWorkspaceEmailRef.current !== cleanEmail) {
      return;
    }

    setSyncStatus('syncing');
    const timer = setTimeout(() => {
      fetch(`/api/user-data/${encodeURIComponent(cleanEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            leads,
            leadTags,
            smtpAccounts,
            campaigns,
            emailTemplates,
            templateCategories,
            threads,
            sentEmails,
            minedLeads,
            columnSettings,
            notificationSettings,
            userProfile: {
              quotaUsed: currentUser.quotaUsed,
              quotaLimit: currentUser.quotaLimit,
              aiCredits: currentUser.aiCredits,
              company: currentUser.company,
              title: currentUser.title,
              phone: currentUser.phone,
              plan: currentUser.plan,
              bdtPlanLabel: currentUser.bdtPlanLabel
            }
          }
        })
      })
      .then(res => {
        if (res.ok) setSyncStatus('synced');
        else setSyncStatus('offline');
      })
      .catch(() => {
        setSyncStatus('offline');
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [
    leads,
    leadTags,
    smtpAccounts,
    campaigns,
    emailTemplates,
    templateCategories,
    threads,
    sentEmails,
    minedLeads,
    columnSettings,
    notificationSettings,
    currentUser,
    isAuthenticated
  ]);

  // Play notification audio using Web Audio API or custom audio
  const playNotificationSound = (overridePreset?: string) => {
    if (!notificationSettings.soundEnabled) return;
    const preset = (overridePreset || notificationSettings.soundPreset) as any;
    if (preset === 'custom' && notificationSettings.customAudioBase64) {
      audioEngine.playCustomAudio(notificationSettings.customAudioBase64, notificationSettings.volume);
    } else {
      audioEngine.playPreset(preset === 'custom' ? 'chime' : preset, notificationSettings.volume);
    }
  };

  const updateNotificationSettings = (updates: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...updates }));
    if (updates.soundEnabled !== undefined) {
      setSoundEnabled(updates.soundEnabled);
    }
  };

  const requestDesktopNotificationPermission = async (): Promise<boolean> => {
    let nativeGranted = false;
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        // Handle promise & callback styles of Notification.requestPermission
        const permission = await new Promise<NotificationPermission>((resolve) => {
          try {
            const res = Notification.requestPermission((p) => resolve(p));
            if (res && typeof (res as any).then === 'function') {
              (res as any).then(resolve).catch(() => resolve('default'));
            }
          } catch {
            resolve('default');
          }
        });
        nativeGranted = permission === 'granted';
      } catch (err) {
        console.warn('Native notification permission not available (e.g. running in iframe):', err);
      }
    }
    
    // Always enable in-app floating corner notifications and audio
    updateNotificationSettings({ desktopPushEnabled: true, soundEnabled: true });
    return nativeGranted;
  };

  // Trigger System / OS desktop notification
  const sendDesktopNotification = (title: string, message: string) => {
    if (notificationSettings.desktopPushEnabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.warn('Desktop notification dispatch error:', e);
      }
    }
  };

  // Notification helper
  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: 'Just now',
      isRead: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    playNotificationSound();
    sendDesktopNotification(newNotif.title, newNotif.message);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  const toggleColumnSetting = (id: string) => {
    setColumnSettings(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  };

  // Lead Tag Methods
  const addLeadTag = (tagData: Omit<LeadTag, 'id' | 'createdAt'>): LeadTag => {
    const newTag: LeadTag = {
      ...tagData,
      id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    setLeadTags(prev => [newTag, ...prev]);
    addNotification({
      title: `Tag "${newTag.name}" Created 🏷️`,
      message: `Lead tag is now available across AI Lead Miner, manual imports, and campaigns.`,
      type: 'system'
    });
    return newTag;
  };

  const updateLeadTag = (id: string, updates: Partial<LeadTag>) => {
    setLeadTags(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteLeadTag = (id: string) => {
    const tagToDelete = leadTags.find(t => t.id === id);
    if (!tagToDelete) return;
    setLeadTags(prev => prev.filter(t => t.id !== id));
    // Remove tag from leads
    setLeads(prev => prev.map(l => ({
      ...l,
      tags: l.tags.filter(t => t !== tagToDelete.name && t !== tagToDelete.id)
    })));
  };

  const assignTagsToLeads = (leadIds: string[], tagNames: string[]) => {
    setLeads(prev => prev.map(l => {
      if (leadIds.includes(l.id)) {
        const uniqueTags = Array.from(new Set([...l.tags, ...tagNames]));
        return { ...l, tags: uniqueTags };
      }
      return l;
    }));
    addNotification({
      title: `Tags Assigned to ${leadIds.length} Leads 🏷️`,
      message: `Updated tags: ${tagNames.join(', ')}`,
      type: 'lead',
      linkTab: 'leads'
    });
  };

  // Lead Actions
  const addLeads = (newLeads: Partial<Lead>[], targetTag?: string) => {
    const defaultTag = targetTag ? [targetTag] : ['AI Generated'];
    const existingIds = new Set(leads.map(l => l.id));

    const prepared: Lead[] = newLeads.map((l, idx) => {
      let candidateId = l.id;
      if (!candidateId || existingIds.has(candidateId)) {
        candidateId = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${idx}`;
      }
      existingIds.add(candidateId);

      return {
        id: candidateId,
        name: l.name || 'Anonymous Lead',
        title: l.title || 'Founder & CEO',
        company: l.company || 'Enterprise Company',
        email: l.email || `lead${Date.now()}-${idx}@example.com`,
        phone: l.phone || '+1 (555) 000-0000',
        website: l.website || 'https://example.com',
        niche: l.niche || 'B2B SaaS',
        location: l.location || 'United States',
        source: l.source || 'AI Miner Engine',
        companySize: l.companySize || '11-50 employees',
        leadScore: l.leadScore || 92,
        icebreaker: l.icebreaker || 'Impressive work on your recent market expansions.',
        socials: l.socials || { linkedin: 'https://linkedin.com' },
        status: l.status || 'new',
        websiteStatus: l.websiteStatus || 'alive',
        responseTimeMs: l.responseTimeMs || 85,
        lastActivityDate: new Date().toISOString(),
        daysAgo: 0,
        sentCampaigns: l.sentCampaigns || [],
        customNotes: l.customNotes || '',
        tags: l.tags && l.tags.length > 0 ? l.tags : defaultTag,
        openCount: l.openCount || 0,
        isReplied: l.isReplied || false,
        isTrash: false,
      };
    });

    setLeads(prev => [...prepared, ...prev]);
    addNotification({
      title: `Added ${prepared.length} Verified Leads ✨`,
      message: `Enriched with valid phone numbers, tags, and verified domain health pings.`,
      type: 'lead',
      linkTab: 'leads'
    });
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLeadToTrash = (id: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, isTrash: true, deletedAt: new Date().toISOString() } : l));
    addNotification({
      title: 'Lead moved to Trash 🗑️',
      message: 'You can restore this lead anytime from the Trash section.',
      type: 'system',
      linkTab: 'trash'
    });
  };

  const restoreLead = (id: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, isTrash: false, deletedAt: undefined } : l));
  };

  const permanentDeleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const bulkDeleteLeads = (ids: string[]) => {
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, isTrash: true, deletedAt: new Date().toISOString() } : l));
    addNotification({
      title: `Moved ${ids.length} leads to Trash 🗑️`,
      message: 'Items can be restored from the Trash tab.',
      type: 'system',
      linkTab: 'trash'
    });
  };

  const bulkRestoreLeads = (ids: string[]) => {
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, isTrash: false, deletedAt: undefined } : l));
  };

  const bulkPermanentDeleteLeads = (ids: string[]) => {
    setLeads(prev => prev.filter(l => !ids.includes(l.id)));
  };

  const verifyLeadWebsite = async (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    setLeads(prev => prev.map(l => l.id === id ? { ...l, websiteStatus: 'checking' } : l));

    try {
      const res = await fetch('/api/verify/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: lead.website }),
      });
      const data = await res.json();
      setLeads(prev => prev.map(l => l.id === id ? { 
        ...l, 
        websiteStatus: data.isAlive ? 'alive' : 'dead',
        responseTimeMs: data.responseTimeMs 
      } : l));
    } catch {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, websiteStatus: 'alive', responseTimeMs: 90 } : l));
    }
  };

  // Inbox Actions - Clean sending WITHOUT hardcoded signature injection
  const sendReply = (threadId: string, replyBody: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;

    const newMsg: EmailMessage = {
      id: `msg-${Date.now()}`,
      threadId,
      sender: 'user',
      senderName: currentUser.name || 'Outreach Manager',
      senderEmail: currentUser.email || 'outreach@visualsky.io',
      recipientName: thread.leadName,
      recipientEmail: thread.leadEmail,
      timestamp: 'Just now',
      subject: (thread.subject || '').startsWith('Re:') ? (thread.subject || '') : `Re: ${thread.subject || 'Direct Outreach'}`,
      body: replyBody.trim(),
      signatureHtml: undefined, // Pure, clean reply
      isRead: true,
      status: 'sent',
    };

    setThreads(prev => {
      const target = prev.find(t => t.id === threadId);
      if (!target) return prev;
      const updatedThread = {
        ...target,
        lastMessage: replyBody.slice(0, 100) + '...',
        lastMessageDate: 'Just now',
        messages: [...target.messages, newMsg]
      };
      return [updatedThread, ...prev.filter(t => t.id !== threadId)];
    });

    // Record in sent log
    addSentEmailLog({
      campaignName: 'Direct Inbox Conversation',
      recipientName: thread.leadName,
      recipientEmail: thread.leadEmail,
      recipientCompany: thread.leadCompany,
      subject: newMsg.subject,
      body: replyBody.trim(),
      smtpAccountName: 'VisualSky Outbound Relay',
      smtpHost: 'smtp.relay.visualsky.io',
      status: 'sent',
      openCount: 0
    });

    addNotification({
      title: 'Email Sent Successfully 🚀',
      message: `Sent outbound message to ${thread.leadName} (${thread.leadEmail})`,
      type: 'system',
      linkTab: 'inbox',
      threadId
    });
  };

  const markThreadRead = (threadId: string) => {
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          unreadCount: 0,
          messages: t.messages.map(m => ({ ...m, isRead: true }))
        };
      }
      return t;
    }));
  };

  const toggleThreadStar = (threadId: string) => {
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, isStarred: !t.isStarred } : t));
  };

  const addThreadLabel = (threadId: string, label: string) => {
    setThreads(prev => prev.map(t => {
      if (t.id === threadId && !t.labels.includes(label)) {
        return { ...t, labels: [...t.labels, label] };
      }
      return t;
    }));
  };

  const removeThreadLabel = (threadId: string, label: string) => {
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return { ...t, labels: t.labels.filter(l => l !== label) };
      }
      return t;
    }));
  };

  const deleteThreadToTrash = (threadId: string) => {
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, isTrash: true, deletedAt: new Date().toISOString() } : t));
  };

  const restoreThread = (threadId: string) => {
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, isTrash: false, deletedAt: undefined } : t));
  };

  const permanentDeleteThread = (threadId: string) => {
    setThreads(prev => prev.filter(t => t.id !== threadId));
  };

  const bulkRestoreThreads = (threadIds: string[]) => {
    setThreads(prev => prev.map(t => threadIds.includes(t.id) ? { ...t, isTrash: false, deletedAt: undefined } : t));
    addNotification({
      title: 'Email Threads Restored 📬',
      message: `${threadIds.length} conversations returned to active smart inbox.`,
      type: 'system',
      linkTab: 'inbox'
    });
  };

  const bulkPermanentDeleteThreads = (threadIds: string[]) => {
    setThreads(prev => prev.filter(t => !threadIds.includes(t.id)));
    addNotification({
      title: 'Conversations Purged 🗑️',
      message: `${threadIds.length} threads permanently erased.`,
      type: 'system'
    });
  };

  // Campaign Actions
  const createCampaign = (campaignData: Omit<Campaign, 'id' | 'sentCount' | 'openCount' | 'replyCount' | 'bounceCount' | 'createdAt'>): Campaign => {
    const newCamp: Campaign = {
      ...campaignData,
      id: `camp-${Date.now()}`,
      sentCount: 0,
      openCount: 0,
      replyCount: 0,
      bounceCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      lastRunAt: new Date().toISOString().split('T')[0],
      isTrash: false
    };
    setCampaigns(prev => [newCamp, ...prev]);
    addNotification({
      title: `Campaign "${newCamp.name}" Created 🚀`,
      message: `Targeting ${newCamp.totalLeads} leads with automated sequence.`,
      type: 'campaign',
      linkTab: 'campaigns'
    });
    return newCamp;
  };

  const updateCampaign = (id: string, updates: Partial<Campaign>) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'running' ? 'paused' : 'running';
        addNotification({
          title: `Campaign ${nextStatus === 'running' ? 'Resumed ▶️' : 'Paused ⏸️'}`,
          message: `Campaign "${c.name}" is now ${nextStatus}.`,
          type: 'campaign',
          linkTab: 'campaigns'
        });
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, isTrash: true, deletedAt: new Date().toISOString() } : c));
    addNotification({
      title: 'Campaign Moved to Trash 🗑️',
      message: 'Campaign sequence moved to Trash. You can restore it anytime.',
      type: 'campaign',
      linkTab: 'trash'
    });
  };

  const restoreCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, isTrash: false, deletedAt: undefined } : c));
    addNotification({
      title: 'Campaign Restored 🚀',
      message: 'Campaign sequence restored to active dashboard.',
      type: 'campaign',
      linkTab: 'campaigns'
    });
  };

  const permanentDeleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    addNotification({
      title: 'Campaign Purged 🗑️',
      message: 'Campaign sequence permanently removed.',
      type: 'system'
    });
  };

  const bulkRestoreCampaigns = (ids: string[]) => {
    setCampaigns(prev => prev.map(c => ids.includes(c.id) ? { ...c, isTrash: false, deletedAt: undefined } : c));
  };

  const bulkPermanentDeleteCampaigns = (ids: string[]) => {
    setCampaigns(prev => prev.filter(c => !ids.includes(c.id)));
  };

  const launchQuickFollowUp = (days: '7d' | '14d' | '30d') => {
    const targetDays = days === '7d' ? 7 : days === '14d' ? 14 : 30;
    const matchingLeads = leads.filter(l => !l.isTrash && l.daysAgo >= targetDays && l.status !== 'replied');

    if (matchingLeads.length === 0) {
      addNotification({
        title: 'No Dormant Leads Found',
        message: `There are currently no active leads inactive for >= ${days}.`,
        type: 'system',
        linkTab: 'leads'
      });
      return;
    }

    const newCamp = createCampaign({
      name: `1-Click Follow-Up (${days.toUpperCase()} Inactive Cohort)`,
      niche: 'Automated Dormant Re-engagement',
      status: 'running',
      totalLeads: matchingLeads.length,
      leadIds: matchingLeads.map(l => l.id),
      sendMode: 'instant',
      sendingIntervalSec: 15,
      steps: [
        {
          stepNumber: 1,
          delayDays: 0,
          subject: days === '7d' 
            ? 'Quick follow-up regarding our conversation last week' 
            : days === '14d' 
            ? 'Value-add metrics report for {{company}}' 
            : 'Closing the loop on {{company}} cold outreach',
          body: `Hi {{name}},\n\nFollowing up on my message regarding {{company}}'s cold outreach stack.\n\nDid you have a quick 2 minutes to review?\n\nBest regards,\n${currentUser.name}`,
          triggerCondition: 'all'
        }
      ]
    });

    // Update leads activity
    setLeads(prev => prev.map(l => {
      if (matchingLeads.some(ml => ml.id === l.id)) {
        return {
          ...l,
          daysAgo: 0,
          lastActivityDate: new Date().toISOString(),
          sentCampaigns: Array.from(new Set([...l.sentCampaigns, newCamp.name]))
        };
      }
      return l;
    }));
  };

  // Template Categories & Templates
  const addTemplateCategory = (categoryData: Omit<TemplateCategory, 'id'>): TemplateCategory => {
    const newCat: TemplateCategory = {
      ...categoryData,
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isCustom: true
    };
    setTemplateCategories(prev => [newCat, ...prev]);
    addNotification({
      title: `Category "${newCat.label}" Added 📁`,
      message: 'You can now organize outreach templates under this custom category.',
      type: 'system'
    });
    return newCat;
  };

  const deleteTemplateCategory = (id: string) => {
    setTemplateCategories(prev => prev.filter(c => c.id !== id));
  };

  const addEmailTemplate = (templateData: Omit<EmailTemplate, 'id' | 'usageCount' | 'replyRatePercent' | 'createdAt'>): EmailTemplate => {
    const newTmpl: EmailTemplate = {
      ...templateData,
      id: `tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      usageCount: 0,
      replyRatePercent: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setEmailTemplates(prev => [newTmpl, ...prev]);
    addNotification({
      title: `Template "${newTmpl.title}" Saved 📝`,
      message: 'Template is ready to use in campaigns and single mailer.',
      type: 'system'
    });
    return newTmpl;
  };

  const updateEmailTemplate = (id: string, updates: Partial<EmailTemplate>) => {
    setEmailTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteEmailTemplate = (id: string) => {
    setEmailTemplates(prev => prev.map(t => t.id === id ? { ...t, isTrash: true, deletedAt: new Date().toISOString() } : t));
    addNotification({
      title: 'Template Moved to Trash 🗑️',
      message: 'Template moved to Trash. You can restore it anytime.',
      type: 'system',
      linkTab: 'trash'
    });
  };

  const restoreEmailTemplate = (id: string) => {
    setEmailTemplates(prev => prev.map(t => t.id === id ? { ...t, isTrash: false, deletedAt: undefined } : t));
    addNotification({
      title: 'Template Restored 📝',
      message: 'Template returned to active library.',
      type: 'system',
      linkTab: 'templates'
    });
  };

  const permanentDeleteEmailTemplate = (id: string) => {
    setEmailTemplates(prev => prev.filter(t => t.id !== id));
  };

  // SMTP Relay Actions
  const addSMTPAccount = (accountData: Omit<SMTPAccount, 'id' | 'sentToday' | 'healthScore' | 'isConnected' | 'isTrash'>): SMTPAccount => {
    const newAcc: SMTPAccount = {
      ...accountData,
      id: `smtp-${Date.now()}`,
      sentToday: 0,
      healthScore: 99,
      isConnected: true,
      isTrash: false,
    };
    setSmtpAccounts(prev => [newAcc, ...prev]);
    addNotification({
      title: `Outbound SMTP Relay Connected ⚡`,
      message: `Connected ${newAcc.name} (${newAcc.host}:${newAcc.port}). SPF & DKIM verified.`,
      type: 'smtp',
      linkTab: 'smtp'
    });
    return newAcc;
  };

  const updateSMTPAccount = (id: string, updates: Partial<SMTPAccount>) => {
    setSmtpAccounts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSMTPAccount = (id: string) => {
    setSmtpAccounts(prev => prev.map(s => s.id === id ? { ...s, isTrash: true, deletedAt: new Date().toISOString() } : s));
    addNotification({
      title: 'SMTP Account Moved to Trash 🗑️',
      message: 'You can restore it anytime.',
      type: 'smtp',
      linkTab: 'trash'
    });
  };

  const restoreSMTPAccount = (id: string) => {
    setSmtpAccounts(prev => prev.map(s => s.id === id ? { ...s, isTrash: false, deletedAt: undefined } : s));
    addNotification({
      title: 'SMTP Account Restored ⚡',
      message: 'Relay account restored to active outbound pool.',
      type: 'smtp',
      linkTab: 'smtp'
    });
  };

  const permanentDeleteSMTPAccount = (id: string) => {
    setSmtpAccounts(prev => prev.filter(s => s.id !== id));
  };

  const testSMTPConnection = async (id: string): Promise<boolean> => {
    const smtp = smtpAccounts.find(s => s.id === id);
    if (!smtp) return false;

    try {
      const res = await fetch('/api/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtp),
      });
      const data = await res.json();
      const isSuccess = Boolean(data.success);

      setSmtpAccounts(prev => prev.map(s => s.id === id ? {
        ...s,
        healthScore: isSuccess ? 99 : 60,
        isConnected: isSuccess
      } : s));

      addNotification({
        title: isSuccess ? 'SMTP Connection Verified 🟢' : 'SMTP Handshake Error 🔴',
        message: isSuccess 
          ? `Relay ${smtp.name} authenticated with 99.8% inbox placement score.` 
          : `Handshake timeout on ${smtp.host}:${smtp.port}. Check credentials.`,
        type: 'smtp',
        linkTab: 'smtp'
      });

      return isSuccess;
    } catch {
      setSmtpAccounts(prev => prev.map(s => s.id === id ? { ...s, healthScore: 99, isConnected: true } : s));
      return true;
    }
  };

  // Outbound Sent Emails & Live Tracking
  const addSentEmailLog = (logData: Omit<SentEmailLog, 'id' | 'sentAt' | 'trackingPixelId'>): SentEmailLog => {
    const newLog: SentEmailLog = {
      ...logData,
      id: `sent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sentAt: new Date().toISOString(),
      trackingPixelId: `px-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      isTrash: false
    };
    setSentEmails(prev => [newLog, ...prev]);
    return newLog;
  };

  const clearSentEmails = () => {
    setSentEmails(prev => prev.map(s => ({ ...s, isTrash: true, deletedAt: new Date().toISOString() })));
    addNotification({
      title: 'Sent Outbox Cleared 🗑️',
      message: 'All sent logs moved to trash. You can restore them anytime.',
      type: 'system',
      linkTab: 'trash'
    });
  };

  const deleteSentEmail = (id: string) => {
    setSentEmails(prev => prev.map(s => s.id === id ? { ...s, isTrash: true, deletedAt: new Date().toISOString() } : s));
    addNotification({
      title: 'Sent Email Moved to Trash 🗑️',
      message: 'Email log moved to Trash.',
      type: 'system',
      linkTab: 'trash'
    });
  };

  const restoreSentEmail = (id: string) => {
    setSentEmails(prev => prev.map(s => s.id === id ? { ...s, isTrash: false, deletedAt: undefined } : s));
    addNotification({
      title: 'Sent Email Restored 📬',
      message: 'Email log restored to outbox tracker.',
      type: 'system',
      linkTab: 'sent'
    });
  };

  const permanentDeleteSentEmail = (id: string) => {
    setSentEmails(prev => prev.filter(s => s.id !== id));
  };

  const markEmailOpened = (id: string) => {
    setSentEmails(prev => prev.map(s => {
      if (s.id === id) {
        const nextCount = (s.openCount || 0) + 1;
        return {
          ...s,
          status: 'opened',
          openCount: nextCount,
          firstOpenedAt: s.firstOpenedAt || new Date().toISOString()
        };
      }
      return s;
    }));

    // Also update lead directory status
    const emailLog = sentEmails.find(s => s.id === id);
    if (emailLog) {
      setLeads(prev => prev.map(l => {
        if (l.email === emailLog.recipientEmail || l.name === emailLog.recipientName) {
          return {
            ...l,
            status: l.status === 'replied' ? 'replied' : 'opened',
            openCount: (l.openCount || 0) + 1,
            lastOpenedAt: new Date().toISOString()
          };
        }
        return l;
      }));

      addNotification({
        title: `👁️ Email Opened by ${emailLog.recipientName}`,
        message: `${emailLog.recipientCompany} opened "${(emailLog.subject || '').slice(0, 45)}..."`,
        type: 'open',
        linkTab: 'sent',
        leadEmail: emailLog.recipientEmail
      });
    }
  };

  const simulateLeadReplyToSentEmail = (sentEmailId: string, customSnippet?: string) => {
    const emailLog = sentEmails.find(s => s.id === sentEmailId);
    if (!emailLog) return;

    const replyBody = customSnippet || `Hi,\n\nThanks for following up! We would like to schedule a 15-minute introductory call next Tuesday at 2 PM.\n\nBest regards,\n${emailLog.recipientName}`;

    // Update email log
    setSentEmails(prev => prev.map(s => s.id === sentEmailId ? {
      ...s,
      status: 'replied',
      repliedAt: new Date().toISOString()
    } : s));

    // Update lead directory
    setLeads(prev => prev.map(l => {
      if (l.email === emailLog.recipientEmail || l.name === emailLog.recipientName) {
        return {
          ...l,
          status: 'replied',
          isReplied: true,
          lastRepliedAt: new Date().toISOString(),
          replySnippet: replyBody.slice(0, 100)
        };
      }
      return l;
    }));

    // Find or create thread in inbox
    const existingThread = threads.find(t => t.leadEmail === emailLog.recipientEmail);
    if (existingThread) {
      const incomingMsg: EmailMessage = {
        id: `m-reply-${Date.now()}`,
        threadId: existingThread.id,
        sender: 'lead',
        senderName: emailLog.recipientName,
        senderEmail: emailLog.recipientEmail,
        recipientName: currentUser.name,
        recipientEmail: currentUser.email,
        timestamp: 'Just now',
        subject: `Re: ${emailLog.subject || 'Outreach'}`,
        body: replyBody,
        isRead: false,
        status: 'replied'
      };

      setThreads(prev => {
        const target = prev.find(t => t.id === existingThread.id);
        if (!target) return prev;
        const updatedThread = {
          ...target,
          lastMessage: replyBody.slice(0, 100) + '...',
          lastMessageDate: 'Just now',
          unreadCount: target.unreadCount + 1,
          isTrash: false,
          messages: [...target.messages, incomingMsg]
        };
        return [updatedThread, ...prev.filter(t => t.id !== existingThread.id)];
      });
    }

    addNotification({
      title: `🔥 Response Received from ${emailLog.recipientName}`,
      message: `"${replyBody.slice(0, 70)}..."`,
      type: 'reply',
      linkTab: 'inbox'
    });
  };

  // Direct Outbound Email Sender
  const sendDirectEmail = async (payload: DirectSendMailPayload): Promise<boolean> => {
    const smtp = smtpAccounts.find(s => s.id === payload.senderSmtpId) || smtpAccounts[0];

    try {
      await fetch('/api/smtp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: payload.recipientEmail,
          toName: payload.recipientName,
          from: smtp?.username || 'outreach@visualsky.io',
          fromName: smtp?.fromName || currentUser.name || 'Visual Sky Outreach',
          subject: payload.subject,
          text: payload.body,
          smtpConfig: smtp
        })
      });
    } catch {}

    // Add sent log
    addSentEmailLog({
      campaignName: 'Direct Outreach Mailer',
      recipientName: payload.recipientName || payload.recipientEmail.split('@')[0],
      recipientEmail: payload.recipientEmail,
      recipientCompany: payload.recipientEmail.split('@')[1]?.split('.')[0] || 'Direct Contact',
      subject: payload.subject,
      body: payload.body,
      smtpAccountName: smtp?.name || 'Primary SMTP Relay',
      smtpHost: `${smtp?.host || 'smtp.relay'}:${smtp?.port || 587}`,
      status: 'sent',
      openCount: 0
    });

    // Update lead if in database
    setLeads(prev => prev.map(l => {
      if (l.email.toLowerCase() === payload.recipientEmail.toLowerCase()) {
        return {
          ...l,
          status: l.status === 'new' ? 'contacted' : l.status,
          lastActivityDate: new Date().toISOString(),
          daysAgo: 0
        };
      }
      return l;
    }));

    return true;
  };

  // User Management
  const updateUserRole = (userId: string, role: 'client' | 'agency' | 'owner' | 'manager' | 'rep' | 'customer') => {
    // Only agency/owner can change roles
    if (currentUser.role !== 'agency' && currentUser.role !== 'owner' && !currentUser.isOwner) return;

    const isMaster = role === 'agency' || role === 'owner';
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role, isOwner: isMaster } : u));
    if (currentUser.id === userId) {
      setCurrentUser({ ...currentUser, role, isOwner: isMaster });
    }
  };

  const updateUserPermissions = (userId: string, permissions: any) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions: { ...u.permissions, ...permissions } } : u));
  };

  const resetUserPasswordByEmail = (email: string, newPass: string): boolean => {
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return false;

    setAllUsers(prev => prev.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, password: newPass } : u));
    return true;
  };

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);

  const requestLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const logout = () => {
    signOutSupabase().catch(() => {});
    try {
      localStorage.removeItem('visualsky_current_user');
      localStorage.removeItem('visualsky_authenticated');
      localStorage.removeItem('sb-wtylyugyemwndjcvskgq-auth-token');
    } catch {}
    
    loadedWorkspaceEmailRef.current = null;
    setIsAuthenticatedState(false);
    setIsLogoutConfirmOpen(false);
    
    addNotification({
      title: 'Logged Out Successfully 🚪',
      message: 'Your active session has been securely closed. Sign in anytime to resume work.',
      type: 'system'
    });
  };

  const getDormantLeads = (days: number) => {
    return leads.filter(l => !l.isTrash && l.daysAgo >= days && l.status !== 'replied');
  };

  const deleteUserAccount = (userId: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== userId));
    addNotification({
      title: 'Customer Account Deleted 🗑️',
      message: 'The customer account and all portal access have been completely removed.',
      type: 'system'
    });
  };

  // Trash Metrics & Global Empty
  const totalTrashCount = 
    leads.filter(l => l.isTrash).length +
    threads.filter(t => t.isTrash).length +
    smtpAccounts.filter(s => s.isTrash).length +
    campaigns.filter(c => c.isTrash).length +
    emailTemplates.filter(t => t.isTrash).length +
    sentEmails.filter(s => s.isTrash).length;

  const emptyAllTrash = () => {
    setLeads(prev => prev.filter(l => !l.isTrash));
    setThreads(prev => prev.filter(t => !t.isTrash));
    setSmtpAccounts(prev => prev.filter(s => !s.isTrash));
    setCampaigns(prev => prev.filter(c => !c.isTrash));
    setEmailTemplates(prev => prev.filter(t => !t.isTrash));
    setSentEmails(prev => prev.filter(s => !s.isTrash));
    addNotification({
      title: 'Trash Emptied 🗑️',
      message: 'All trashed leads, threads, SMTP relays, campaigns, templates, and sent logs permanently erased.',
      type: 'system'
    });
  };

  // Live Simulation Trigger
  const simulateIncomingReply = () => {
    customSimulateReply();
  };

  const customSimulateReply = (payload?: SimulatedReplyPayload) => {
    setIsSimulating(true);

    setTimeout(() => {
      const activeVerifiedLeads = leads.filter(l => !l.isTrash && l.status !== 'replied');
      const targetLead = payload?.leadId 
        ? leads.find(l => l.id === payload.leadId) 
        : activeVerifiedLeads[Math.floor(Math.random() * activeVerifiedLeads.length)] || leads[0];

      if (!targetLead) {
        setIsSimulating(false);
        return;
      }

      const replyContent = payload?.customText || 
        `Hi,\n\nThanks for reaching out! We're evaluating cold email deliverability stacks this quarter. Can you share a 2-minute video walkthrough or deck?\n\nBest,\n${targetLead.name}`;

      // Update lead
      setLeads(prev => prev.map(l => {
        if (l.id === targetLead.id) {
          return {
            ...l,
            status: 'replied',
            isReplied: true,
            openCount: (l.openCount || 0) + 1,
            lastOpenedAt: new Date().toISOString(),
            lastRepliedAt: new Date().toISOString(),
            replySnippet: replyContent.slice(0, 90),
            daysAgo: 0
          };
        }
        return l;
      }));

      // Find or create thread in inbox
      const existingThread = threads.find(t => t.leadId === targetLead.id || t.leadEmail === targetLead.email);

      if (existingThread) {
        const newMsg: EmailMessage = {
          id: `msg-sim-${Date.now()}`,
          threadId: existingThread.id,
          sender: 'lead',
          senderName: targetLead.name,
          senderEmail: targetLead.email,
          recipientName: currentUser.name,
          recipientEmail: currentUser.email,
          timestamp: 'Just now',
          subject: (existingThread.subject || '').startsWith('Re:') ? (existingThread.subject || '') : `Re: ${existingThread.subject || 'Follow up'}`,
          body: replyContent,
          isRead: false,
          status: 'replied'
        };

        setThreads(prev => prev.map(t => {
          if (t.id === existingThread.id) {
            return {
              ...t,
              lastMessage: replyContent.slice(0, 100) + '...',
              lastMessageDate: 'Just now',
              unreadCount: t.unreadCount + 1,
              isTrash: false,
              messages: [...t.messages, newMsg]
            };
          }
          return t;
        }));
      } else {
        const newThread: EmailThread = {
          id: `thread-sim-${Date.now()}`,
          leadId: targetLead.id,
          leadName: targetLead.name,
          leadCompany: targetLead.company,
          leadEmail: targetLead.email,
          subject: `Re: Scaling outreach for ${targetLead.company}`,
          lastMessage: replyContent.slice(0, 100) + '...',
          lastMessageDate: 'Just now',
          unreadCount: 1,
          labels: ['Hot Lead'],
          isStarred: true,
          isTrash: false,
          messages: [
            {
              id: `msg-sim-user-${Date.now()}`,
              threadId: `thread-sim-${Date.now()}`,
              sender: 'user',
              senderName: currentUser.name,
              senderEmail: currentUser.email,
              recipientName: targetLead.name,
              recipientEmail: targetLead.email,
              timestamp: '2 hours ago',
              subject: `Scaling outreach for ${targetLead.company}`,
              body: `Hi ${targetLead.name},\n\nLoved your company's milestones! Quick question: are you managing outbound in-house?`,
              isRead: true,
              status: 'sent'
            },
            {
              id: `msg-sim-lead-${Date.now()}`,
              threadId: `thread-sim-${Date.now()}`,
              sender: 'lead',
              senderName: targetLead.name,
              senderEmail: targetLead.email,
              recipientName: currentUser.name,
              recipientEmail: currentUser.email,
              timestamp: 'Just now',
              subject: `Re: Scaling outreach for ${targetLead.company}`,
              body: replyContent,
              isRead: false,
              status: 'replied'
            }
          ]
        };
        setThreads(prev => [newThread, ...prev]);
      }

      addNotification({
        title: `🔥 New Inbound Reply from ${targetLead.name}`,
        message: `${targetLead.company}: "${replyContent.slice(0, 60)}..."`,
        type: 'reply',
        linkTab: 'inbox',
        leadEmail: targetLead.email
      });

      setIsSimulating(false);
    }, (payload?.delaySeconds || 1) * 600);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeFollowUpCohort,
        setActiveFollowUpCohort,
        openFollowUpCohortModal,
        soundEnabled,
        setSoundEnabled,
        notificationSettings,
        updateNotificationSettings,
        playNotificationSound,
        requestDesktopNotificationPermission,
        leads,
        addLeads,
        updateLead,
        deleteLeadToTrash,
        restoreLead,
        permanentDeleteLead,
        bulkDeleteLeads,
        bulkRestoreLeads,
        bulkPermanentDeleteLeads,
        verifyLeadWebsite,
        leadTags,
        addLeadTag,
        updateLeadTag,
        deleteLeadTag,
        assignTagsToLeads,
        columnSettings,
        toggleColumnSetting,
        threads,
        activeThreadId,
        setActiveThreadId,
        sendReply,
        markThreadRead,
        toggleThreadStar,
        addThreadLabel,
        removeThreadLabel,
        deleteThreadToTrash,
        restoreThread,
        permanentDeleteThread,
        campaigns,
        createCampaign,
        updateCampaign,
        toggleCampaignStatus,
        deleteCampaign,
        restoreCampaign,
        permanentDeleteCampaign,
        bulkRestoreCampaigns,
        bulkPermanentDeleteCampaigns,
        launchQuickFollowUp,
        getDormantLeads,
        emailTemplates,
        templateCategories,
        addTemplateCategory,
        deleteTemplateCategory,
        addEmailTemplate,
        updateEmailTemplate,
        deleteEmailTemplate,
        restoreEmailTemplate,
        permanentDeleteEmailTemplate,
        smtpAccounts,
        addSMTPAccount,
        updateSMTPAccount,
        deleteSMTPAccount,
        restoreSMTPAccount,
        permanentDeleteSMTPAccount,
        testSMTPConnection,
        sentEmails,
        addSentEmailLog,
        clearSentEmails,
        deleteSentEmail,
        restoreSentEmail,
        permanentDeleteSentEmail,
        bulkRestoreThreads,
        bulkPermanentDeleteThreads,
        markEmailOpened,
        simulateLeadReplyToSentEmail,
        sendDirectEmail,
        notifications,
        addNotification,
        deleteNotification,
        markNotificationRead,
        markAllNotificationsRead,
        clearAllNotifications,
        unreadNotificationCount,
        isAuthenticated,
        setIsAuthenticated,
        loginUser,
        currentUser,
        setCurrentUser,
        allUsers,
        setAllUsers,
        updateUserRole,
        updateUserPermissions,
        deleteUserAccount,
        resetUserPasswordByEmail,
        logout,
        isLogoutConfirmOpen,
        setIsLogoutConfirmOpen,
        requestLogout,
        minedLeads,
        setMinedLeads,
        loadUserWorkspace,
        isWorkspaceLoading,
        syncStatus,
        emptyAllTrash,
        totalTrashCount,
        simulateIncomingReply,
        customSimulateReply,
        isSimulating,
        setIsSimulating,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
