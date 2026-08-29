import React, { useState } from 'react';
import { VisualSkyLogo } from '../brand/VisualSkyLogo';
import { 
  Sparkles, 
  ShieldCheck, 
  Server, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Inbox, 
  BarChart3, 
  Users, 
  Bot, 
  Mail, 
  FileText, 
  Globe, 
  Lock, 
  Crown, 
  Check, 
  Send, 
  TrendingUp, 
  Activity, 
  CreditCard,
  ChevronDown,
  Layers,
  Flame,
  Clock,
  ArrowUpRight,
  Shield,
  HelpCircle
} from 'lucide-react';
import { BDT_CLIENT_PLANS } from '../auth/AuthModal';

interface LandingPageProps {
  onOpenAuth: (mode?: 'signin' | 'signup' | 'forgot_password', portal?: 'client' | 'agency', plan?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'smtp' | 'miner' | 'inbox' | 'radar'>('smtp');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does the gradual +15/day SMTP warmup protect deliverability?',
      a: 'VisualSky automates a controlled warm-up ramp starting at 15 emails on Day 1, gradually incrementing by +15 each day. This builds genuine domain reputation across Google, Outlook, and Yahoo spam filters without triggering rate limits or spam traps.'
    },
    {
      q: 'Can I connect my own custom SMTP servers and domain emails?',
      a: 'Yes! VisualSky supports Google Workspace, Microsoft 365, AWS SES, SendGrid, Mailgun, and any custom cPanel/VPS SMTP server over SSL/TLS with automated SPF, DKIM, and DMARC verification handshakes.'
    },
    {
      q: 'How do subscription payments work for users in Bangladesh?',
      a: 'All subscription tiers are priced directly in BDT with instant verification across bKash, Nagad, and Rocket merchant and personal payment routing. Subscriptions activate immediately upon TrxID verification.'
    },
    {
      q: 'Can I manage client workspaces and agency sub-accounts?',
      a: 'Yes! The Agency Master tier allows agency principals to create and manage client sub-workspaces, configure custom sending quotas, assign dedicated SMTP relays, and monitor client campaign performance.'
    },
    {
      q: 'How does the AI Lead Miner find verified B2B leads?',
      a: 'Our AI Miner scours real-time business registries and corporate domains, verifying MX records and deliverability before exporting them into your pipeline with clean tags, phone numbers, and company metadata.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 flex flex-col font-sans">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. STICKY TOP NAVIGATION BAR                                  */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 w-full bg-[#080c14]/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <VisualSkyLogo size="md" />
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              v2.8 Enterprise Outbound
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-semibold text-slate-400">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#engine" className="hover:text-cyan-400 transition-colors">Warmup Engine</a>
            <a href="#leads" className="hover:text-cyan-400 transition-colors">AI Miner</a>
            <a href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
          </nav>

          {/* Top CTAs: Sign In & Sign Up */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuth('signin', 'client')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('signup', 'client')}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-500/25 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. HERO SECTION                                               */}
      {/* ------------------------------------------------------------- */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden border-b border-slate-800/50">
        
        {/* Glow Gradients in Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/15 to-purple-600/10 blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Live Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-lg shadow-cyan-950/40 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 -ml-4" />
            <span>Next-Gen High Deliverability Cold Email Infrastructure</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-100 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Scale High-Converting Outbound with <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Guaranteed 99.4% Inbox Placement</span>
          </h1>

          {/* Subheading */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto font-normal">
            Automated multi-relay SMTP rotation, gradual +15/day warmup ramp, real-time AI lead miner, unified sentiment inbox, and zero-spam deliverability radar—built for high-growth agencies and B2B leaders.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => onOpenAuth('signup', 'client')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 transition cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Start Free 14-Day Trial</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onOpenAuth('signin', 'agency')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Agency Master Portal</span>
            </button>
          </div>

          {/* Hero Trust Points */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No Spam Trap Guarantee</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Automated +15/Day Warmup Ramp</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span>AI Sentiment Inbox Categorization</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Direct bKash / Nagad / Rocket Payments</span>
            </span>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* HERO INTERACTIVE SHOWCASE CARD                                 */}
          {/* ------------------------------------------------------------- */}
          <div className="pt-10 max-w-5xl mx-auto">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 text-left space-y-5 backdrop-blur-md">
              
              {/* Card Window Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 ml-2">
                    visualsky://workspace/deliverability-engine
                  </span>
                </div>

                {/* Interactive Preview Tabs */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                  <button
                    onClick={() => setActivePreviewTab('smtp')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      activePreviewTab === 'smtp' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    SMTP Rotation
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('miner')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      activePreviewTab === 'miner' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    AI Lead Miner
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('inbox')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      activePreviewTab === 'inbox' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Smart Inbox
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('radar')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      activePreviewTab === 'radar' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Deliverability Radar
                  </button>
                </div>
              </div>

              {/* Tab 1: SMTP Warmup & Rotation View */}
              {activePreviewTab === 'smtp' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                      <div className="text-[11px] font-bold text-slate-400">Total Active Relays</div>
                      <div className="text-xl font-black text-cyan-400 mt-0.5">4 Dedicated Slots</div>
                      <div className="text-[10px] text-emerald-400 font-semibold mt-1">✓ Round-robin load balanced</div>
                    </div>
                    <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                      <div className="text-[11px] font-bold text-slate-400">Warmup Strategy</div>
                      <div className="text-xl font-black text-purple-400 mt-0.5">+15/Day Ramp</div>
                      <div className="text-[10px] text-purple-300 font-semibold mt-1">Day 14 &bull; 210 emails/day cap</div>
                    </div>
                    <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                      <div className="text-[11px] font-bold text-slate-400">Reputation Score</div>
                      <div className="text-xl font-black text-emerald-400 mt-0.5">99.8 / 100</div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-1">0 Blacklist incidents</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-300">Live Active Relay Pools</div>
                    <div className="space-y-2">
                      <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="font-mono font-bold text-slate-200">outreach.primary@visualsky.io</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-mono">Port 587 (TLS)</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-slate-400">Sent: 184 / 210</span>
                          <span className="text-emerald-400 font-bold">100% Inbox Placement</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="font-mono font-bold text-slate-200">sales.relay02@visualsky-growth.com</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 font-mono">Port 465 (SSL)</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-slate-400">Sent: 142 / 210</span>
                          <span className="text-emerald-400 font-bold">99.4% Inbox Placement</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: AI Lead Miner */}
              {activePreviewTab === 'miner' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-between text-xs text-purple-300">
                    <span className="font-bold">Target Search: "B2B SaaS Founders in North America & Singapore"</span>
                    <span className="font-mono font-bold bg-purple-500/20 px-2 py-0.5 rounded">24 Leads Verified in 3.4s</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-800 text-slate-400">
                        <tr>
                          <th className="pb-2 font-bold">Lead Contact</th>
                          <th className="pb-2 font-bold">Company & Niche</th>
                          <th className="pb-2 font-bold">Verified Email</th>
                          <th className="pb-2 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        <tr>
                          <td className="py-2.5 font-bold text-slate-200">Sarah Jenkins (CEO)</td>
                          <td className="py-2.5 text-slate-400">CloudSync Technologies</td>
                          <td className="py-2.5 text-cyan-400">sarah@cloudsync.io</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">✓ 100% Deliverable</span></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold text-slate-200">David Miller (VP Sales)</td>
                          <td className="py-2.5 text-slate-400">ScaleFlow Metrics</td>
                          <td className="py-2.5 text-cyan-400">david@scaleflow.ai</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">✓ 100% Deliverable</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Smart Inbox */}
              {activePreviewTab === 'inbox' && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">Sarah Jenkins &bull; CloudSync</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          🎯 Meeting Requested
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">12m ago</span>
                    </div>
                    <p className="text-xs text-slate-300 italic">
                      "Hi! This deliverability framework sounds exactly like what our sales reps need. Do you have 15 minutes this Thursday at 2 PM?"
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <button 
                        onClick={() => onOpenAuth('signup', 'client')}
                        className="px-3 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition flex items-center gap-1.5"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>AI One-Click Reply: "Accept Meeting for Thursday"</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Deliverability Radar */}
              {activePreviewTab === 'radar' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                    <div className="text-[10px] font-bold text-slate-400">SPF Record</div>
                    <div className="text-lg font-black text-emerald-400 mt-0.5">100% Pass</div>
                    <div className="text-[10px] text-slate-500">v=spf1 include:...</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                    <div className="text-[10px] font-bold text-slate-400">DKIM 2048-bit</div>
                    <div className="text-lg font-black text-emerald-400 mt-0.5">100% Valid</div>
                    <div className="text-[10px] text-slate-500">Signed with RSA</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                    <div className="text-[10px] font-bold text-slate-400">DMARC Policy</div>
                    <div className="text-lg font-black text-cyan-400 mt-0.5">p=quarantine</div>
                    <div className="text-[10px] text-slate-500">Alignment Passed</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
                    <div className="text-[10px] font-bold text-slate-400">Blacklist Check</div>
                    <div className="text-lg font-black text-emerald-400 mt-0.5">0 / 64 Clean</div>
                    <div className="text-[10px] text-slate-500">Spamhaus, Barracuda</div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. PLATFORM CAPABILITIES & BENTO GRID                         */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="py-20 border-b border-slate-800/60 bg-[#080c14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              Core Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
              Everything Needed for 7-Figure Cold Outbound
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Purpose-built tooling designed to eliminate spam folder traps, accelerate lead discovery, and automate follow-ups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-4 hover:border-cyan-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Server className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-100">Smart SMTP Rotation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Distribute high-volume cold email traffic evenly across multiple relays. Avoid domain burnout and stay below provider throttling thresholds.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-4 hover:border-purple-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-100">AI Lead Miner & Scraper</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Discover verified B2B prospect emails, company phone numbers, and tech stack tags directly within the platform in seconds.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-4 hover:border-emerald-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-100">Sentiment-Aware Smart Inbox</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  AI automatically classifies replies into Meeting Booked, Interested, or Not Interested with 1-click tailored reply drafts.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-4 hover:border-amber-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-100">Deliverability Radar</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time health audits for SPF, DKIM, DMARC, and MX records with automated alerts if reputation dips below target thresholds.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-4 hover:border-rose-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-100">Anti-Spam Pre-Flight Auditor</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Calculates spam trigger risk score on subjects and bodies before launching sequences. Includes dynamic spintax syntax.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-4 hover:border-blue-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-100">Agency Master Dashboard</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Manage independent client workspaces, assign custom quotas, suspend or approve sub-users, and receive direct payment payouts.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. TRANSPARENT BDT SUBSCRIPTION PRICING SECTION               */}
      {/* ------------------------------------------------------------- */}
      <section id="pricing" className="py-20 border-b border-slate-800/60 bg-[#080c14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              Simple & Transparent Pricing
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
              Invest in Guaranteed Primary Inbox Placement
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Direct checkout in Bangladeshi Taka (BDT) with bKash, Nagad, and Rocket instant verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {BDT_CLIENT_PLANS.map((plan) => {
              const isPopular = plan.id === 'scale';
              return (
                <div 
                  key={plan.id}
                  className={`relative p-6 sm:p-8 rounded-2xl flex flex-col justify-between transition-all duration-200 ${
                    isPopular 
                      ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-500 shadow-2xl shadow-cyan-500/10' 
                      : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-black tracking-wider uppercase shadow-lg shadow-cyan-500/30">
                      Most Popular for Agencies
                    </div>
                  )}

                  <div className="space-y-5">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-100">{plan.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{plan.description}</p>
                    </div>

                    <div className="flex items-baseline gap-1.5 pb-2 border-b border-slate-800">
                      <span className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
                        {plan.priceDisplay}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{plan.billingCycle}</span>
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-300">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8">
                    <button
                      onClick={() => onOpenAuth('signup', 'client', plan.id)}
                      className={`w-full py-3 rounded-xl text-xs font-extrabold transition cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                        isPopular
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                      }`}
                    >
                      <span>Choose {plan.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Agency Master Free Promotion Banner */}
          <div className="p-5 bg-gradient-to-r from-amber-500/10 via-slate-900 to-cyan-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Are you an Agency Principal or Workspace Owner?</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Agency Master seats have 100% free unlimited platform capabilities (strictly limited to first 3 seats).
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenAuth('signup', 'agency')}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition cursor-pointer shrink-0 shadow-lg shadow-amber-500/20"
            >
              Claim Agency Seat
            </button>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. FREQUENTLY ASKED QUESTIONS (FAQ)                           */}
      {/* ------------------------------------------------------------- */}
      <section id="faq" className="py-20 border-b border-slate-800/60 bg-[#080c14]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              Answers & Clarifications
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index} 
                  className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-200 hover:text-cyan-400 transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3 animate-in fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. BOTTOM CALL TO ACTION                                      */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 bg-gradient-to-b from-[#080c14] to-slate-950 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Ready to 10x Your Cold Email Meetings Without Landing in Spam?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Join hundreds of B2B founders and outbound agencies scaling with automated warmup, AI scraping, and deliverability radar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenAuth('signup', 'client')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-cyan-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Create Account & Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenAuth('signin', 'client')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm transition cursor-pointer"
            >
              Sign In to Existing Account
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. FOOTER                                                     */}
      {/* ------------------------------------------------------------- */}
      <footer className="py-8 bg-slate-950 border-t border-slate-800 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <VisualSkyLogo size="sm" />
            <span>&copy; {new Date().getFullYear()} VisualSky. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <button 
              onClick={() => onOpenAuth('signin', 'client')}
              className="hover:text-cyan-400 transition"
            >
              Sign In
            </button>
            <button 
              onClick={() => onOpenAuth('signup', 'agency')}
              className="hover:text-cyan-400 transition"
            >
              Agency Portal
            </button>
            <button 
              onClick={() => onOpenAuth('forgot_password', 'client')}
              className="hover:text-cyan-400 transition"
            >
              Password Reset
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
