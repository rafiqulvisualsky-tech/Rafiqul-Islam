import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAccount, CustomerPermissions } from '../../types';
import { 
  ShieldCheck, 
  Users, 
  CreditCard, 
  Zap, 
  Plus, 
  Activity, 
  Server, 
  Key, 
  Sliders, 
  CheckCircle2, 
  XCircle,
  Globe,
  Lock,
  Edit2,
  Trash2,
  Crown,
  Sparkles,
  Check,
  AlertTriangle,
  Settings,
  Mail,
  Send,
  Bot,
  Copy,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OWNER_PAYOUT_ACCOUNTS, BDT_CLIENT_PLANS } from '../auth/AuthModal';

export const OwnerPanel: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUser,
    allUsers, 
    setAllUsers,
    updateUserPlan, 
    deleteUserAccount,
    leads, 
    smtpAccounts, 
    campaigns,
    addNotification 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'customers' | 'billing' | 'system'>('customers');
  const [selectedPlan, setSelectedPlan] = useState<'Free' | 'Pro' | 'Agency' | 'Enterprise'>(currentUser.plan);
  const [copiedPayoutNumber, setCopiedPayoutNumber] = useState<string | null>(null);
  
  // Modal for editing customer permissions
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);

  // New Customer Form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    plan: 'Pro' as const,
    quotaLimit: 10000,
    aiCredits: 500,
    leadMiner: true,
    smartInbox: true,
    campaigns: true,
    smtpAccess: true,
    aiCopilot: true,
  });

  const totalLeadsCount = leads.filter(l => !l.isTrash).length;
  const totalCampaignsCount = campaigns.length;
  const totalSmtpsCount = smtpAccounts.filter(s => !s.isTrash).length;
  
  // Agency / Owner Limit Check (Strictly Max 3 Seats)
  const ownerAccounts = allUsers.filter(u => u.role === 'agency' || u.role === 'owner' || Boolean(u.isOwner));
  const ownerCount = ownerAccounts.length;

  const handlePlanChange = (plan: 'Free' | 'Pro' | 'Agency' | 'Enterprise') => {
    setSelectedPlan(plan);
    updateUserPlan(plan);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.2 } });
  };

  const handleToggleService = (userId: string, serviceKey: keyof CustomerPermissions) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const currentPerms: CustomerPermissions = u.permissions || {
          leadMinerEnabled: true,
          smartInboxEnabled: true,
          campaignAutomationEnabled: true,
          smtpRotationEnabled: true,
          aiCopilotEnabled: true,
          templatesEnabled: true,
          analyticsEnabled: true,
          maxSmtpSlots: 5,
          dailySendLimit: 2000,
          accountStatus: 'active'
        };
        const updatedPerms = {
          ...currentPerms,
          [serviceKey]: !currentPerms[serviceKey]
        };
        const updatedUser = { ...u, permissions: updatedPerms };
        if (currentUser.id === userId) {
          setCurrentUser(updatedUser);
        }
        return updatedUser;
      }
      return u;
    }));
  };

  const handleToggleAccountStatus = (userId: string) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const currentStatus = u.permissions?.accountStatus || 'active';
        const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
        const updatedPerms = {
          ...(u.permissions || {
            leadMinerEnabled: true,
            smartInboxEnabled: true,
            campaignAutomationEnabled: true,
            smtpRotationEnabled: true,
            aiCopilotEnabled: true,
            templatesEnabled: true,
            analyticsEnabled: true,
            maxSmtpSlots: 5,
            dailySendLimit: 2000,
            accountStatus: 'active'
          }),
          accountStatus: nextStatus
        };
        const updatedUser = { ...u, permissions: updatedPerms };
        if (currentUser.id === userId) {
          setCurrentUser(updatedUser);
        }
        return updatedUser;
      }
      return u;
    }));

    addNotification({
      title: 'Customer Status Updated',
      message: 'Account access and outbound quota permissions adjusted.',
      type: 'system'
    });
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.email) return;

    const created: UserAccount = {
      id: `usr-cust-${Date.now()}`,
      name: newCustomer.name,
      email: newCustomer.email,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'customer',
      plan: newCustomer.plan,
      quotaUsed: 0,
      quotaLimit: newCustomer.quotaLimit,
      aiCredits: newCustomer.aiCredits,
      joinedAt: new Date().toISOString().split('T')[0],
      permissions: {
        leadMinerEnabled: newCustomer.leadMiner,
        smartInboxEnabled: newCustomer.smartInbox,
        campaignAutomationEnabled: newCustomer.campaigns,
        smtpRotationEnabled: newCustomer.smtpAccess,
        aiCopilotEnabled: newCustomer.aiCopilot,
        templatesEnabled: true,
        analyticsEnabled: true,
        maxSmtpSlots: newCustomer.plan === 'Enterprise' ? 20 : newCustomer.plan === 'Agency' ? 10 : 3,
        dailySendLimit: newCustomer.quotaLimit / 30,
        accountStatus: 'active'
      }
    };

    setAllUsers(prev => [created, ...prev]);
    setShowAddCustomerModal(false);
    confetti({ particleCount: 50, spread: 60 });
    addNotification({
      title: `Added Customer: ${created.name} 🎉`,
      message: `Assigned ${created.plan} tier with customized service permissions.`,
      type: 'system'
    });
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser.id) return;
    deleteUserAccount(id);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-lg flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              Master Owner Command Center
            </span>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
              Full System Access
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 mt-2">Owner & Customer Service Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Control which services, features, and quotas are granted to each customer and manage workspace subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['customers', 'billing', 'system'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab === 'customers' ? '👥 Customer Services & Access' : tab === 'billing' ? '💳 Subscription Tiers' : '⚙️ System Health'}
            </button>
          ))}
        </div>
      </div>

      {/* Global System Metrics & Owner Account Security Box */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Owner Accounts Quota</div>
          <div className="text-xl font-black text-amber-300 font-mono">
            {ownerCount} / 3 <span className="text-xs text-slate-400 font-sans">(Max 3 Slots)</span>
          </div>
          <div className="text-[10px] text-slate-500">Owner registration strictly protected</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Active Customer Accounts</div>
          <div className="text-xl font-black text-cyan-400 font-mono">{allUsers.length} Users</div>
          <div className="text-[10px] text-cyan-400 font-semibold">100% Active Outbound Nodes</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Workspace Total Leads</div>
          <div className="text-xl font-black text-blue-400 font-mono">{totalLeadsCount} Leads</div>
          <div className="text-[10px] text-blue-300">Enriched with Phone & Web</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">AI Token Balance</div>
          <div className="text-xl font-black text-purple-400 font-mono">{currentUser.aiCredits} Credits</div>
          <div className="text-[10px] text-purple-300">Gemini 3.7 Pro Access</div>
        </div>
      </div>

      {/* Tab: Customer Services & Access Matrix */}
      {activeTab === 'customers' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Customer Account Service Permissions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle individual services (Lead Miner, Smart Inbox, SMTP Rotation, Campaigns, AI Copilot) for each customer in real time.
              </p>
            </div>

            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-blue-500/20 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Customer Account
            </button>
          </div>

          {/* Customers Table / Card List */}
          <div className="space-y-3">
            {allUsers.map((user) => {
              const perms: CustomerPermissions = user.permissions || {
                leadMinerEnabled: true,
                smartInboxEnabled: true,
                campaignAutomationEnabled: true,
                smtpRotationEnabled: true,
                aiCopilotEnabled: true,
                templatesEnabled: true,
                analyticsEnabled: true,
                maxSmtpSlots: 5,
                dailySendLimit: 2000,
                accountStatus: 'active'
              };
              const isSuspended = perms.accountStatus === 'suspended';
              const isOwner = user.role === 'owner' || user.isOwner;

              return (
                <div
                  key={user.id}
                  className={`p-4 md:p-5 rounded-2xl border transition-all space-y-3 ${
                    isSuspended 
                      ? 'bg-slate-950/40 border-rose-900/40 opacity-70' 
                      : 'bg-slate-950/80 hover:bg-slate-950 border-slate-800'
                  }`}
                >
                  {/* Top Row: User Avatar, Name, Email, Plan, Role, Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-cyan-500/40"
                      />
                      <div>
                        <div className="font-bold text-slate-200 text-xs flex items-center gap-2">
                          <span>{user.name}</span>
                          {isOwner && (
                            <span className="px-2 py-0.5 text-[10px] font-black bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 rounded flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-300" /> MASTER OWNER
                            </span>
                          )}
                          {isSuspended && (
                            <span className="px-2 py-0.5 text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded">
                              SUSPENDED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-950/60 text-blue-300 border border-blue-800/60 rounded-lg">
                        {user.plan} Plan
                      </span>
                      <span className="px-2.5 py-1 text-[11px] font-mono text-slate-400 bg-slate-900 rounded-lg border border-slate-800">
                        {user.quotaUsed.toLocaleString()} / {user.quotaLimit.toLocaleString()} sent
                      </span>

                      {!isOwner && (
                        <>
                          <button
                            onClick={() => handleToggleAccountStatus(user.id)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                              isSuspended
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60'
                            }`}
                          >
                            {isSuspended ? 'Activate' : 'Suspend'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition"
                            title="Delete customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Granular Service Permission Toggles */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                      Granted Services:
                    </span>

                    {[
                      { key: 'leadMinerEnabled', label: 'AI Lead Miner', icon: Sparkles },
                      { key: 'smartInboxEnabled', label: 'Smart Inbox', icon: Mail },
                      { key: 'campaignAutomationEnabled', label: 'Campaigns', icon: Send },
                      { key: 'smtpRotationEnabled', label: 'SMTP Hub', icon: Server },
                      { key: 'aiCopilotEnabled', label: 'AI Copilot', icon: Bot },
                      { key: 'templatesEnabled', label: 'Templates', icon: Settings },
                    ].map(svc => {
                      const isGranted = (perms as any)[svc.key] ?? true;
                      const Icon = svc.icon;

                      return (
                        <button
                          key={svc.key}
                          type="button"
                          disabled={isOwner}
                          onClick={() => handleToggleService(user.id, svc.key as any)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                            isGranted
                              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/50'
                              : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800 line-through opacity-60'
                          } ${isOwner ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <Icon className={`w-3 h-3 ${isGranted ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span>{svc.label}</span>
                          {isGranted ? <Check className="w-3 h-3 text-emerald-400 ml-0.5" /> : <XCircle className="w-3 h-3 text-slate-500 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Billing & Subscription Tiers (Bangladeshi Taka BDT) */}
      {activeTab === 'billing' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-6 shadow-2xl">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <span>Client Subscriptions & Direct Merchant Payout Routing (BDT ৳)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage BDT pricing tiers and monitor client subscription payments routed directly to your linked accounts.
              </p>
            </div>
            <span className="self-start sm:self-auto px-2.5 py-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-lg">
              Direct Payout Settlement Active
            </span>
          </div>

          {/* Owner's Linked Payout Accounts in Bangladesh */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>App Owner's Linked Merchant Accounts (Direct Receivers)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">100% Direct Settlement</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(OWNER_PAYOUT_ACCOUNTS) as Array<keyof typeof OWNER_PAYOUT_ACCOUNTS>).map((gKey) => {
                const acc = OWNER_PAYOUT_ACCOUNTS[gKey];
                const isCopied = copiedPayoutNumber === acc.cleanNumber;

                return (
                  <div 
                    key={gKey} 
                    className={`p-3 rounded-xl border ${acc.bgColor} ${acc.borderColor} space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black ${acc.textColor}`}>{acc.gatewayName}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-300 border border-slate-800">
                        Ref: {acc.reference}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <span className="font-mono text-xs font-bold text-slate-100">{acc.number}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(acc.cleanNumber);
                          setCopiedPayoutNumber(acc.cleanNumber);
                          setTimeout(() => setCopiedPayoutNumber(null), 2000);
                        }}
                        className="text-slate-400 hover:text-slate-200 transition"
                        title="Copy account number"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400">{acc.type}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Client Subscription Tiers (BDT ৳) */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300">Client Subscription Plans (BDT ৳)</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {BDT_CLIENT_PLANS.map((p) => {
                const isCurrent = currentUser.plan === p.planCode;

                return (
                  <div
                    key={p.id}
                    className={`p-5 rounded-3xl border flex flex-col justify-between gap-4 relative transition ${
                      p.isPopular
                        ? 'bg-gradient-to-b from-cyan-950/30 to-slate-900 border-cyan-500/60 shadow-xl shadow-cyan-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {p.isPopular && (
                      <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 text-[9px] font-black uppercase bg-cyan-500 text-slate-950 rounded-full shadow">
                        Most Popular
                      </span>
                    )}

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-bold text-slate-100 text-base">{p.name}</h3>
                        <div className="text-2xl font-black text-slate-100 font-mono mt-1">
                          {p.priceDisplay} <span className="text-xs text-slate-400 font-sans">{p.billingCycle}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{p.description}</p>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-cyan-400">{p.quotaLimit.toLocaleString()} Outbound Leads / mo</div>
                        <div className="text-slate-400">{p.aiCredits.toLocaleString()} Gemini AI Credits &bull; {p.maxSmtp} SMTPs</div>
                      </div>

                      <ul className="space-y-1.5 text-[11px] text-slate-300 pt-2 border-t border-slate-800">
                        {p.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handlePlanChange(p.planCode as any)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition shadow ${
                        isCurrent
                          ? 'bg-cyan-600 text-white shadow-cyan-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {isCurrent ? 'Current Workspace Plan' : `Apply ${p.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Client Transactions & Subscriptions Ledger */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-200">
                Recent Client Payments (bKash, Nagad, Rocket Payouts)
              </div>
              <span className="text-[10px] text-slate-400">Directly Verified</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800 text-[10px] uppercase">
                    <th className="pb-2">Client / User</th>
                    <th className="pb-2">Plan</th>
                    <th className="pb-2">Gateway</th>
                    <th className="pb-2">Sender Mobile</th>
                    <th className="pb-2">TrxID</th>
                    <th className="pb-2">Amount (BDT)</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {allUsers.filter(u => u.paymentInfo).length > 0 ? (
                    allUsers.filter(u => u.paymentInfo).map((client) => {
                      const p = client.paymentInfo!;
                      return (
                        <tr key={client.id} className="hover:bg-slate-900/50 transition">
                          <td className="py-2.5 font-medium text-slate-100 flex items-center gap-2">
                            <img src={client.avatar} alt={client.name} className="w-5 h-5 rounded-full object-cover" />
                            <div>
                              <div>{client.name}</div>
                              <div className="text-[10px] text-slate-500">{client.email}</div>
                            </div>
                          </td>
                          <td className="py-2.5 text-cyan-400 font-semibold">{p.planName}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.method === 'bKash' 
                                ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' 
                                : p.method === 'Nagad' 
                                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}>
                              {p.method}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-[11px] text-slate-400">{p.senderPhone}</td>
                          <td className="py-2.5 font-mono font-bold text-amber-300">{p.trxId}</td>
                          <td className="py-2.5 font-mono font-black text-emerald-400">৳{p.amountBDT.toLocaleString()}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Paid & Verified
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-slate-500">
                        No transactions recorded yet. New client registrations will automatically appear here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab: System Health & Edge Gateway */}
      {activeTab === 'system' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4 shadow-2xl">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Real-Time Server & Edge Diagnostic Status
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Production environment health and uptime telemetry.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Gemini 3.7 Flash Gateway</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Operational (100%)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-model cascade resilient AI scraper active.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">DNS & SMTP MX Relay Engine</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> TLS 1.3 Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                SPF / DKIM / DMARC verification handshakes running with 99.8% inbox score.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#090d16] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Add Customer Account & Grant Services
              </h3>
              <button 
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Customer Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alex@company.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Plan Tier</label>
                  <select
                    value={newCustomer.plan}
                    onChange={(e) => setNewCustomer({ ...newCustomer, plan: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Free">Free</option>
                    <option value="Pro">Pro</option>
                    <option value="Agency">Agency</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Monthly Sending Quota</label>
                  <input
                    type="number"
                    value={newCustomer.quotaLimit}
                    onChange={(e) => setNewCustomer({ ...newCustomer, quotaLimit: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-2">Granted Feature Access</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <input
                      type="checkbox"
                      checked={newCustomer.leadMiner}
                      onChange={(e) => setNewCustomer({ ...newCustomer, leadMiner: e.target.checked })}
                      className="rounded border-slate-700 text-blue-500"
                    />
                    <span className="text-slate-300">AI Lead Miner</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <input
                      type="checkbox"
                      checked={newCustomer.smartInbox}
                      onChange={(e) => setNewCustomer({ ...newCustomer, smartInbox: e.target.checked })}
                      className="rounded border-slate-700 text-blue-500"
                    />
                    <span className="text-slate-300">Smart Inbox</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <input
                      type="checkbox"
                      checked={newCustomer.campaigns}
                      onChange={(e) => setNewCustomer({ ...newCustomer, campaigns: e.target.checked })}
                      className="rounded border-slate-700 text-blue-500"
                    />
                    <span className="text-slate-300">Campaigns</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <input
                      type="checkbox"
                      checked={newCustomer.smtpAccess}
                      onChange={(e) => setNewCustomer({ ...newCustomer, smtpAccess: e.target.checked })}
                      className="rounded border-slate-700 text-blue-500"
                    />
                    <span className="text-slate-300">SMTP Hub</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
