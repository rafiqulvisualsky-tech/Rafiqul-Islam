import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SMTPAccount } from '../../types';
import { safeParseResponse } from '../../lib/safeFetch';
import { 
  Server, 
  X, 
  ShieldCheck, 
  Check, 
  Globe, 
  Mail, 
  Lock, 
  Zap, 
  Clock, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Terminal,
  Send,
  Sliders,
  HelpCircle,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SMTPConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (account: SMTPAccount) => void;
  initialProvider?: SMTPAccount['provider'];
  editingAccount?: SMTPAccount | null;
}

export const SMTPConnectModal: React.FC<SMTPConnectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProvider = 'cloud_relay',
  editingAccount
}) => {
  const { addSMTPAccount, updateSMTPAccount } = useApp();

  // Mode: Easy Connect vs Advanced Technical Manual Mode
  const [connectMode, setConnectMode] = useState<'easy' | 'advanced'>('easy');
  const [activeTab, setActiveTab] = useState<'preset' | 'credentials' | 'warmup' | 'test'>('credentials');
  
  // Easy mode selected provider
  const [easyProvider, setEasyProvider] = useState<'cloud_relay' | 'gmail' | 'domain_webmail' | 'resend' | 'brevo'>('cloud_relay');
  
  // Full provider type
  const [provider, setProvider] = useState<SMTPAccount['provider']>(initialProvider || 'cloud_relay');
  
  // Connection Details
  const [accountName, setAccountName] = useState<string>('');
  const [host, setHost] = useState<string>('');
  const [port, setPort] = useState<number>(465);
  const [encryption, setEncryption] = useState<'STARTTLS' | 'SSL' | 'TLS' | 'NONE'>('SSL');
  const [authMethod, setAuthMethod] = useState<'LOGIN' | 'PLAIN' | 'XOAUTH2' | 'CRAM-MD5'>('LOGIN');
  
  // Identity & Webmail
  const [domainWebmailUrl, setDomainWebmailUrl] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [fromName, setFromName] = useState<string>('Visual Sky Outreach');
  const [fromEmail, setFromEmail] = useState<string>('');
  const [replyToEmail, setReplyToEmail] = useState<string>('');

  // Throttle & Warmup
  const [dailyLimit, setDailyLimit] = useState<number>(2500);
  const [warmupMode, setWarmupMode] = useState<'ramp_15' | 'full' | 'paused'>('full');
  const [intervalSeconds, setIntervalSeconds] = useState<number>(15);
  const [jitterRandom, setJitterRandom] = useState<boolean>(true);

  // Handshake Testing States
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testErrorHint, setTestErrorHint] = useState<string | null>(null);
  const [testTargetEmail, setTestTargetEmail] = useState<string>('');
  const [testSending, setTestSending] = useState<boolean>(false);
  const [testSendSuccess, setTestSendSuccess] = useState<boolean | null>(null);

  // Pre-fill on open or edit
  useEffect(() => {
    if (editingAccount) {
      setConnectMode('advanced');
      setProvider(editingAccount.provider);
      setAccountName(editingAccount.name);
      setHost(editingAccount.host);
      setPort(editingAccount.port);
      setEncryption(editingAccount.encryption || 'SSL');
      setAuthMethod(editingAccount.authMethod || 'LOGIN');
      setDomainWebmailUrl(editingAccount.domainWebmailUrl || '');
      setUsername(editingAccount.username);
      setPassword(editingAccount.password || '');
      setFromName(editingAccount.fromName || 'Visual Sky Outreach');
      setFromEmail(editingAccount.fromEmail || editingAccount.username);
      setReplyToEmail(editingAccount.replyToEmail || '');
      setDailyLimit(editingAccount.dailyLimit || 2500);
      setWarmupMode(editingAccount.warmupMode || (editingAccount.warmupStatus === 'warming' ? 'ramp_15' : 'full'));
      setIntervalSeconds(editingAccount.scheduleSettings?.intervalSeconds || 15);
      setJitterRandom(editingAccount.scheduleSettings?.jitterRandom ?? true);
      setActiveTab('credentials');
    } else if (isOpen) {
      setConnectMode('easy');
      handleSelectEasyProvider('cloud_relay');
    }
  }, [editingAccount, isOpen, initialProvider]);

  if (!isOpen) return null;

  // Easy mode provider selection helper
  const handleSelectEasyProvider = (p: 'cloud_relay' | 'gmail' | 'domain_webmail' | 'resend' | 'brevo') => {
    setEasyProvider(p);
    setTestSuccess(null);
    setTestErrorHint(null);
    setTestLogs([]);

    if (p === 'cloud_relay') {
      setProvider('cloud_relay');
      setAccountName('VisualSky Instant Cloud Relay');
      setHost('mail.visualsky.pro');
      setPort(465);
      setEncryption('SSL');
      setUsername('outreach@visualsky.pro');
      setPassword('cloud_relay_active');
      setFromEmail('outreach@visualsky.pro');
      setFromName('Visual Sky Outreach');
      setDailyLimit(2500);
      setWarmupMode('full');
    } else if (p === 'gmail') {
      setProvider('gmail');
      setAccountName('Google Workspace / Gmail');
      setHost('smtp.gmail.com');
      setPort(465);
      setEncryption('SSL');
      setUsername(username.includes('@') ? username : '');
      setPassword('');
      setFromEmail(username);
      setDailyLimit(500);
      setWarmupMode('ramp_15');
    } else if (p === 'domain_webmail') {
      setProvider('domain_webmail');
      setAccountName('Domain Webmail (cPanel)');
      setPort(465);
      setEncryption('SSL');
      // Attempt auto-extract from username
      if (username.includes('@')) {
        const domain = username.split('@')[1];
        setHost(`mail.${domain}`);
        setDomainWebmailUrl(`https://webmail.${domain}`);
      } else {
        setHost('mail.visualsky.pro');
        setDomainWebmailUrl('https://webmail.visualsky.pro');
      }
      setDailyLimit(2000);
      setWarmupMode('ramp_15');
    } else if (p === 'resend') {
      setProvider('resend');
      setAccountName('Resend Cloud API (Port 443)');
      setHost('api.resend.com');
      setPort(443);
      setEncryption('SSL');
      setUsername('resend');
      setPassword('');
      setFromEmail('onboarding@resend.dev');
      setDailyLimit(3000);
      setWarmupMode('full');
    } else if (p === 'brevo') {
      setProvider('brevo');
      setAccountName('Brevo (Sendinblue API)');
      setHost('api.brevo.com');
      setPort(443);
      setEncryption('SSL');
      setUsername('brevo');
      setPassword('');
      setFromEmail(username.includes('@') ? username : '');
      setDailyLimit(300);
      setWarmupMode('full');
    }
  };

  // Auto-detect host from email input in easy webmail mode
  const handleEmailChangeInEasyMode = (val: string) => {
    setUsername(val);
    setFromEmail(val);
    if (easyProvider === 'domain_webmail' && val.includes('@')) {
      const domain = val.split('@')[1];
      if (domain && domain.includes('.')) {
        setHost(`mail.${domain}`);
        setDomainWebmailUrl(`https://webmail.${domain}`);
        setAccountName(`${domain} Webmail`);
      }
    }
  };

  // Full Provider pick for advanced tab
  const handleProviderPick = (p: any) => {
    setProvider(p);
    if (p === 'resend') {
      setAccountName('Resend (Direct HTTPS API)');
      setHost('api.resend.com');
      setEncryption('SSL');
      setPort(443);
      setUsername('resend');
      setDailyLimit(3000);
    } else if (p === 'brevo') {
      setAccountName('Brevo (Sendinblue API)');
      setHost('api.brevo.com');
      setEncryption('SSL');
      setPort(443);
      setUsername('brevo');
      setDailyLimit(300);
    } else if (p === 'domain_webmail') {
      setAccountName('Domain Webmail (cPanel / Custom)');
      setHost('mail.visualsky.pro');
      setEncryption('SSL');
      setPort(465);
      setUsername('outreach@visualsky.pro');
    } else if (p === 'gmail') {
      setAccountName('Google Workspace / Gmail Relay');
      setHost('smtp.gmail.com');
      setEncryption('SSL');
      setPort(465);
    } else if (p === 'cloud_relay') {
      setAccountName('VisualSky Instant Cloud Relay');
      setHost('mail.visualsky.pro');
      setPort(465);
      setEncryption('SSL');
      setUsername('outreach@visualsky.pro');
      setPassword('cloud_relay_active');
    } else {
      setAccountName('Custom Outbound SMTP Server');
      setHost('mail.yourdomain.com');
      setEncryption('SSL');
      setPort(465);
    }
  };

  const handleSelectEncryption = (enc: 'STARTTLS' | 'SSL' | 'TLS' | 'NONE') => {
    setEncryption(enc);
    if (enc === 'SSL') {
      setPort(465);
    } else if (enc === 'STARTTLS' || enc === 'TLS') {
      setPort(587);
    } else if (enc === 'NONE') {
      setPort(25);
    }
  };

  // Handshake test with auto-port negotiation
  const handleTestHandshake = async () => {
    setIsTesting(true);
    setTestSuccess(null);
    setTestErrorHint(null);
    setTestLogs([
      `[INIT] Testing connection for ${accountName || provider}...`,
      `[SOCKET] Connecting to ${host}:${port} (${encryption})...`
    ]);

    try {
      const res = await fetch('/api/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          host,
          port,
          username,
          password,
          encryption: encryption || 'SSL',
          domainWebmailUrl
        })
      });

      const parsed = await safeParseResponse(res, 'SMTP test failed');
      const data = parsed.data || {};

      if (parsed.ok && data.success) {
        setTestSuccess(true);
        if (data.activePort && data.activePort !== port) {
          setPort(data.activePort);
        }
        setTestLogs(data.logs || [
          `[DNS] Domain records verified for ${host}`,
          `[SOCKET] Successfully connected to port ${data.activePort || port}`,
          `[AUTH] Credentials accepted for ${username}`,
          `[STATUS] 100% Ready for cold email dispatch.`
        ]);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } else {
        setTestSuccess(false);
        setTestErrorHint(data.error || 'Connection failed. Check host, port, or password.');
        setTestLogs(data.logs || [
          `[ERROR] Connection failed: ${data.error || 'Connection timed out or rejected'}`,
          `[HINT] Try using VisualSky Instant Cloud Relay or Resend API for zero-hassle sending.`
        ]);
      }
    } catch (err: any) {
      setTestSuccess(false);
      setTestErrorHint(err?.message || 'Network error');
      setTestLogs(prev => [
        ...prev,
        `[ERROR] Failed to reach server: ${err?.message || 'Network error'}`
      ]);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testTargetEmail) return;
    setTestSending(true);
    setTestSendSuccess(null);

    try {
      const res = await fetch('/api/smtp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testTargetEmail,
          toName: 'Deliverability Tester',
          from: fromEmail || username,
          fromName,
          subject: `Visual Sky SMTP Relay Test Ping [${Date.now().toString().slice(-4)}]`,
          text: `Hello!\n\nThis is a real-time deliverability handshake test from Visual Sky Outbound Relay (${accountName}).\n\n- SMTP Host: ${host}:${port}\n- Security: ${encryption}\n- Webmail: ${domainWebmailUrl || 'N/A'}\n- Time: ${new Date().toUTCString()}\n\nVerified direct delivery test.`,
          smtpConfig: {
            provider,
            host,
            port,
            encryption: encryption || 'SSL',
            username,
            password,
            apiKey: password
          }
        })
      });
      const parsed = await safeParseResponse(res, 'Failed to dispatch test email');
      const data = parsed.data || {};
      if (parsed.ok && data.success) {
        setTestSendSuccess(true);
        confetti({ particleCount: 50, spread: 70 });
      } else {
        setTestSendSuccess(false);
        setTestLogs(prev => [
          ...prev,
          `[SEND ERROR] Failed to send test mail: ${data.error || 'SMTP rejection'}`
        ]);
      }
    } catch (err: any) {
      setTestSendSuccess(false);
      setTestLogs(prev => [
        ...prev,
        `[SEND ERROR] Network error: ${err?.message || 'Failed to dispatch test mail'}`
      ]);
    } finally {
      setTestSending(false);
    }
  };

  // Form validity:
  // For cloud_relay: always valid!
  // For resend/brevo: password (apiKey) is required
  // For other providers: username and password required
  const isFormValid = Boolean(
    provider === 'cloud_relay' ||
    (provider === 'resend' && password.trim().length > 0) ||
    (provider === 'brevo' && password.trim().length > 0) ||
    (host.trim() && username.trim() && password.trim())
  );

  const handleSaveAccount = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isFormValid) return;

    const finalHost = host || (provider === 'gmail' ? 'smtp.gmail.com' : 'mail.visualsky.pro');
    const finalPort = Number(port) || 465;

    const payload = {
      name: accountName || `${provider === 'cloud_relay' ? 'VisualSky Cloud' : provider.toUpperCase()} Relay`,
      provider,
      host: finalHost,
      port: finalPort,
      encryption: encryption || 'SSL',
      username: username || 'outreach@visualsky.pro',
      fromName: fromName || 'Visual Sky Outreach',
      fromEmail: fromEmail || username || 'outreach@visualsky.pro',
      domainWebmailUrl: domainWebmailUrl || undefined,
      replyToEmail: replyToEmail || undefined,
      authMethod,
      dailyLimit: Number(dailyLimit) || 2500,
      warmupStatus: warmupMode === 'ramp_15' ? ('warming' as const) : warmupMode === 'paused' ? ('paused' as const) : ('active' as const),
      warmupMode,
      warmupStartDate: editingAccount?.warmupStartDate || new Date().toISOString(),
      password: password || 'cloud_relay_active',
      apiKey: provider === 'resend' || provider === 'brevo' ? password : undefined,
      isConnected: true,
      healthScore: 99,
      scheduleSettings: {
        sendMode: 'instant' as const,
        intervalSeconds: Number(intervalSeconds) || 15,
        jitterRandom,
        scheduleStartTime: '09:00',
        scheduleEndTime: '18:00',
        timezone: 'America/New_York',
        activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      }
    };

    if (editingAccount) {
      updateSMTPAccount(editingAccount.id, payload);
      if (onSuccess) onSuccess({ ...editingAccount, ...payload });
    } else {
      const newAcc = addSMTPAccount(payload);
      if (onSuccess) onSuccess(newAcc);
    }

    confetti({ particleCount: 70, spread: 80 });
    onClose();
  };

  // Instant 1-click cloud relay activation
  const handleInstantActivateCloudRelay = () => {
    handleSelectEasyProvider('cloud_relay');
    const payload = {
      name: 'VisualSky Instant Cloud Relay',
      provider: 'cloud_relay' as const,
      host: 'mail.visualsky.pro',
      port: 465,
      encryption: 'SSL' as const,
      username: 'outreach@visualsky.pro',
      fromName: fromName || 'Visual Sky Outreach',
      fromEmail: 'outreach@visualsky.pro',
      dailyLimit: 2500,
      warmupStatus: 'active' as const,
      warmupMode: 'full' as const,
      warmupStartDate: new Date().toISOString(),
      password: 'cloud_relay_active',
      isConnected: true,
      healthScore: 100,
      notes: 'Zero-config instant cloud outbound relay'
    };

    const newAcc = addSMTPAccount(payload);
    if (onSuccess) onSuccess(newAcc);
    confetti({ particleCount: 80, spread: 90 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-[#090d16] border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-blue-950/50 via-slate-900 to-cyan-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                {editingAccount ? 'Edit Email Relay Settings' : 'Connect Outbound Email Relay'}
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                  Hassle-Free &amp; 100% Reliable
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                1-ক্লিকে ঝামেলামুক্ত কানেক্ট করুন অথবা আপনার নিজস্ব Gmail/Webmail/API দিয়ে শুরু করুন।
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector: Easy Connect vs Advanced Technical */}
        <div className="flex border-b border-slate-800 bg-slate-950/90 px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setConnectMode('easy')}
            className={`py-2.5 px-4 rounded-t-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer border-t border-x ${
              connectMode === 'easy'
                ? 'bg-[#090d16] border-slate-800 text-cyan-300 shadow-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>⚡ Easy Connect (ঝামেলামুক্ত সহজ কানেক্ট)</span>
            <span className="px-1.5 py-0.2 text-[9px] bg-cyan-500/20 text-cyan-300 rounded font-black">
              RECOMMENDED
            </span>
          </button>

          <button
            type="button"
            onClick={() => setConnectMode('advanced')}
            className={`py-2.5 px-4 rounded-t-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer border-t border-x ${
              connectMode === 'advanced'
                ? 'bg-[#090d16] border-slate-800 text-slate-200 shadow-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>⚙️ Advanced Manual Settings (পোর্ট ও ওয়ার্ম-আপ)</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* ================= EASY CONNECT MODE ================= */}
          {connectMode === 'easy' && (
            <div className="space-y-5 animate-in fade-in">
              
              {/* Easy Provider Selector Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  পছন্দের কানেকশন মেথড বেছে নিন (Select Provider)
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  
                  {/* Card 1: VisualSky Instant Cloud Relay */}
                  <button
                    type="button"
                    onClick={() => handleSelectEasyProvider('cloud_relay')}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      easyProvider === 'cloud_relay'
                        ? 'bg-gradient-to-br from-cyan-950/60 via-slate-900 to-blue-950/50 border-cyan-400 ring-2 ring-cyan-400/80 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                          <Zap className="w-4 h-4" />
                        </div>
                        <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded uppercase">
                          Zero Setup • Instant
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-100">
                        VisualSky Cloud Relay
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        কোনো পাসওয়ার্ড বা হোস্ট কনফিগ ছাড়াই সঙ্গে সঙ্গে লাইভ মেইল পাঠান।
                      </div>
                    </div>
                  </button>

                  {/* Card 2: Google Workspace / Gmail */}
                  <button
                    type="button"
                    onClick={() => handleSelectEasyProvider('gmail')}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      easyProvider === 'gmail'
                        ? 'bg-gradient-to-br from-blue-950/60 via-slate-900 to-indigo-950/50 border-blue-400 ring-2 ring-blue-400/80 shadow-lg shadow-blue-500/20'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                          <Mail className="w-4 h-4" />
                        </div>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                          Gmail / Workspace
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-100">
                        Gmail (App Password)
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        ১৬ অক্ষরের Google App Password দিয়ে সহজে কানেক্ট করুন।
                      </div>
                    </div>
                  </button>

                  {/* Card 3: Domain Webmail / cPanel */}
                  <button
                    type="button"
                    onClick={() => handleSelectEasyProvider('domain_webmail')}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      easyProvider === 'domain_webmail'
                        ? 'bg-gradient-to-br from-cyan-950/60 via-slate-900 to-teal-950/50 border-cyan-400 ring-2 ring-cyan-400/80 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                          <Globe className="w-4 h-4" />
                        </div>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded">
                          cPanel / Webmail
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-100">
                        Domain Webmail
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        যেমন: mail.visualsky.pro বা আপনার ডোমেইন ইমেইল।
                      </div>
                    </div>
                  </button>

                  {/* Card 4: Resend API */}
                  <button
                    type="button"
                    onClick={() => handleSelectEasyProvider('resend')}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      easyProvider === 'resend'
                        ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900 to-teal-950/50 border-emerald-400 ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                          Free 3,000/mo
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-100">
                        Resend API (Port 443)
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        ১০০% নির্ভরযোগ্য HTTPS API, ক্লাউড ফায়ারওয়াল কোনোদিন ব্লক করবে না।
                      </div>
                    </div>
                  </button>

                  {/* Card 5: Brevo */}
                  <button
                    type="button"
                    onClick={() => handleSelectEasyProvider('brevo')}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      easyProvider === 'brevo'
                        ? 'bg-gradient-to-br from-purple-950/60 via-slate-900 to-indigo-950/50 border-purple-400 ring-2 ring-purple-400/80 shadow-lg shadow-purple-500/20'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                          <Send className="w-4 h-4" />
                        </div>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                          Free 300/day
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-100">
                        Brevo (Sendinblue)
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight">
                        ফ্রি অ্যাকাউন্ট থেকে প্রতিদিন ৩০০টি আউটরিচ মেইল পাঠান।
                      </div>
                    </div>
                  </button>

                </div>
              </div>

              {/* Dynamic Easy Input Section depending on selected provider */}
              
              {/* 1. VISUALSKY CLOUD RELAY VIEW */}
              {easyProvider === 'cloud_relay' && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-500/40 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">
                        VisualSky Instant Cloud Outbox (কোনো সেটআপ প্রয়োজন নেই)
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        আপনার কোনো SMTP হোস্ট, পোর্ট বা পাসওয়ার্ড খোঁজা লাগবে না। এটি সরাসরি ক্লাউড ক্লাস্টারের মাধ্যমে আউটবাউন্ড সিকোয়েন্স ও মেইল সফলভাবে ডেলিভারি করে।
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Sender Display Name (প্রেরকের নাম)</label>
                      <input
                        type="text"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        placeholder="e.g. Visual Sky Outreach"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Reply-To Email (উত্তর পাওয়ার ইমেইল)</label>
                      <input
                        type="email"
                        value={replyToEmail}
                        onChange={(e) => setReplyToEmail(e.target.value)}
                        placeholder="e.g. yourname@gmail.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-800/40 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      ক্যাপাসিটি: <strong>২,৫০০ ইমেইল/দিন</strong> • হেলথ স্কোর: <strong>১০০%</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleInstantActivateCloudRelay}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition"
                    >
                      <Zap className="w-4 h-4" />
                      <span>⚡ ১-ক্লিকে অ্যাক্টিভেট করুন</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. GMAIL / GOOGLE WORKSPACE EASY VIEW */}
              {easyProvider === 'gmail' && (
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-blue-500/40 space-y-4">
                  <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-xl text-xs space-y-1.5">
                    <div className="font-bold text-blue-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-blue-400" />
                        Google App Password জরুরি (Gmail পাসওয়ার্ড কাজ করবে না)
                      </span>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>App Password তৈরি করুন ↗</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      গুগল সিকিউরিটির জন্য আপনার সাধারণ জিমেইল পাসওয়ার্ড দিয়ে SMTP কানেক্ট করতে দেয় না। ১ মিনিটে একটি <strong>16-character App Password</strong> তৈরি করে এখানে দিন।
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-200">Gmail Address (জিমেইল ঠিকানা) *</label>
                      <input
                        type="email"
                        required
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setFromEmail(e.target.value);
                        }}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-400 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200">16-Character App Password *</label>
                        <span className="text-[10px] text-blue-400">xxxx xxxx xxxx xxxx</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="১৬ অক্ষরের অ্যাপ পাসওয়ার্ড পেস্ট করুন"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-200">Sender Display Name (প্রেরকের নাম)</label>
                      <input
                        type="text"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        placeholder="e.g. Rafiqul Islam | Visual Sky"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-200">Auto-configured Protocol</label>
                      <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono flex items-center justify-between">
                        <span>smtp.gmail.com:465 (SSL)</span>
                        <span className="text-emerald-400 text-[10px] font-bold">Auto Dual-Port Fallback</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. DOMAIN WEBMAIL / CPANEL EASY VIEW */}
              {easyProvider === 'domain_webmail' && (
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/40 space-y-4">
                  <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-xs text-slate-300">
                    💡 <strong>Smart Auto-Detect:</strong> আপনি ইমেইল লিখলেই আপনার ডোমেইন (যেমন <code>mail.visualsky.pro</code>) স্বয়ংক্রিয়ভাবে ডিটেক্ট হয়ে পোর্ট 465 ও SSL কনফিগার হয়ে যাবে।
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-200">Full Webmail Email (পূর্ণ ইমেইল ঠিকানা) *</label>
                      <input
                        type="email"
                        required
                        value={username}
                        onChange={(e) => handleEmailChangeInEasyMode(e.target.value)}
                        placeholder="e.g. outreach@visualsky.pro"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-200">Mailbox Password (ইমেইল পাসওয়ার্ড) *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="cPanel / Webmail পাসওয়ার্ড লিখুন"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-200">SMTP Host (সার্ভার হোস্ট)</label>
                      <input
                        type="text"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        placeholder="e.g. mail.visualsky.pro"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-200">Sender Display Name (প্রেরকের নাম)</label>
                      <input
                        type="text"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        placeholder="e.g. Visual Sky Outreach"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. RESEND API EASY VIEW */}
              {easyProvider === 'resend' && (
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/40 space-y-4">
                  <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-emerald-300 flex items-center justify-between">
                      <span>🚀 Resend API (HTTPS Port 443 — Zero Port Block)</span>
                      <a
                        href="https://resend.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>ফ্রি API Key নিন ↗</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Vercel বা ক্লাউড সার্ভারে SMTP পোর্ট 465/587 ব্লক থাকলে Resend API ১০০% নিশ্চিত সমাধান। প্রতি মাসে ৩,০০০ ইমেইল সম্পূর্ণ ফ্রি।
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-200">Resend API Key (re_...) *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="re_123456789_abcdefg..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-200">Sender Email (প্রেরকের ইমেইল)</label>
                      <input
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        placeholder="e.g. outreach@yourdomain.com বা onboarding@resend.dev"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-400 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-200">Sender Display Name</label>
                      <input
                        type="text"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        placeholder="e.g. Visual Sky Outreach"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. BREVO EASY VIEW */}
              {easyProvider === 'brevo' && (
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-purple-500/40 space-y-4">
                  <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-purple-300 flex items-center justify-between">
                      <span>⚡ Brevo (Sendinblue API &amp; SMTP)</span>
                      <a
                        href="https://app.brevo.com/settings/keys/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>Brevo Key নিন ↗</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      প্রতিদিন ৩০০টি আউটরিচ মেইল বিনামূল্যে পাঠান। Brevo API Key (xkeysib-...) পেস্ট করুন।
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-200">Brevo API Key (xkeysib-...) *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="xkeysib-..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-400 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-200">Sender Email (Brevo Verified Email) *</label>
                      <input
                        type="email"
                        required
                        value={fromEmail}
                        onChange={(e) => {
                          setFromEmail(e.target.value);
                          setUsername(e.target.value);
                        }}
                        placeholder="e.g. your@company.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-400 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-200">Sender Display Name</label>
                      <input
                        type="text"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        placeholder="e.g. Visual Sky Outreach"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Live Test & Status Box */}
              {easyProvider !== 'cloud_relay' && (
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-xs text-slate-300">
                      <span className="font-bold block text-slate-200">লাইভ কানেকশন টেস্ট করুন</span>
                      <span className="text-[11px] text-slate-400">সার্ভার ক্রেডেনশিয়াল এবং পোর্ট ঠিক আছে কি না নিশ্চিত হয়ে নিন</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestHandshake}
                      disabled={isTesting || !isFormValid}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                    >
                      {isTesting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                          <span>যাচাই করা হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                          <span>⚡ Test Connection Now</span>
                        </>
                      )}
                    </button>
                  </div>

                  {testSuccess === true && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-300 font-bold">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        কানেকশন সফল! আপনার অ্যাকাউন্ট মেইল পাঠানোর জন্য প্রস্তুত।
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        100% VERIFIED
                      </span>
                    </div>
                  )}

                  {testSuccess === false && testErrorHint && (
                    <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-rose-300 font-bold">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>ত্রুটি: {testErrorHint}</span>
                      </div>
                      
                      <div className="pt-2 border-t border-rose-900/40 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                        <span className="text-slate-300">
                          ঝামেলা ছাড়াই এখনই কাজ চালিয়ে যেতে চান?
                        </span>
                        <button
                          type="button"
                          onClick={handleInstantActivateCloudRelay}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Switch to VisualSky Cloud Relay (Instant Working)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ================= ADVANCED MANUAL MODE ================= */}
          {connectMode === 'advanced' && (
            <div className="space-y-4 animate-in fade-in">
              
              {/* Tab Navigation for Advanced */}
              <div className="flex border-b border-slate-800 bg-slate-950/60 rounded-xl p-1 gap-1 text-xs">
                {[
                  { id: 'preset', label: '1. Provider Preset', icon: Layers },
                  { id: 'credentials', label: '2. Server & Ports', icon: Mail },
                  { id: 'warmup', label: '3. Warmup & Limits', icon: Sliders },
                  { id: 'test', label: '4. Live Console Logs', icon: Terminal },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Presets */}
              {activeTab === 'preset' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'cloud_relay', label: 'VisualSky Cloud', desc: 'Zero-Config Instant Outbox', color: 'border-cyan-500' },
                    { id: 'resend', label: 'Resend API', desc: 'HTTPS Port 443 (3,000 free)', color: 'border-emerald-500' },
                    { id: 'brevo', label: 'Brevo (Sendinblue)', desc: 'HTTPS API (300 free/day)', color: 'border-purple-500' },
                    { id: 'domain_webmail', label: 'Domain Webmail', desc: 'cPanel (Port 465 SSL)', color: 'border-blue-500' },
                    { id: 'gmail', label: 'Google Workspace', desc: 'Gmail App Password', color: 'border-indigo-500' },
                    { id: 'custom', label: 'Custom SMTP Server', desc: 'Custom Host & Port', color: 'border-slate-500' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProviderPick(p.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                        provider === p.id ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs">{p.label}</div>
                      <div className="text-[10px] text-slate-400">{p.desc}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Tab 2: Server Credentials */}
              {activeTab === 'credentials' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Account Friendly Name</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="e.g. Primary Outreach Relay"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Domain Webmail Portal URL (Optional)</label>
                      <input
                        type="url"
                        value={domainWebmailUrl}
                        onChange={(e) => setDomainWebmailUrl(e.target.value)}
                        placeholder="https://webmail.visualsky.pro"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">SMTP Host / Server Address</label>
                      <input
                        type="text"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        placeholder="mail.yourdomain.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Port (465 SSL or 587 TLS)</label>
                      <input
                        type="number"
                        value={port}
                        onChange={(e) => setPort(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Username / Mailbox Address</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="outreach@yourdomain.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Password / App Secret / API Key</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                      />
                    </div>
                  </div>

                  {/* Protocol Selector */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Encryption Protocol</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'SSL', label: 'SSL Protocol (Port 465)' },
                        { id: 'STARTTLS', label: 'STARTTLS (Port 587)' },
                        { id: 'NONE', label: 'None (Port 25)' }
                      ].map(enc => (
                        <button
                          key={enc.id}
                          type="button"
                          onClick={() => handleSelectEncryption(enc.id as any)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            encryption === enc.id ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {enc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Warmup */}
              {activeTab === 'warmup' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Daily Cap (Emails/day)</label>
                      <input
                        type="number"
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Sending Delay (Seconds)</label>
                      <input
                        type="number"
                        value={intervalSeconds}
                        onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300">
                    Warmup Ramp: +15 emails/day increment automatically applied to protect domain reputation.
                  </div>
                </div>
              )}

              {/* Tab 4: Console Test */}
              {activeTab === 'test' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-bold">Live Handshake Console</span>
                    <button
                      type="button"
                      onClick={handleTestHandshake}
                      disabled={isTesting}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1"
                    >
                      <Activity className="w-3 h-3" />
                      <span>Run Ping</span>
                    </button>
                  </div>
                  <div className="bg-black/90 p-3 rounded-xl font-mono text-[11px] text-slate-300 min-h-28 max-h-40 overflow-y-auto space-y-1">
                    {testLogs.length === 0 ? (
                      <span className="text-slate-600 italic">No tests run yet.</span>
                    ) : (
                      testLogs.map((log, idx) => (
                        <div key={idx} className={log.includes('ERROR') ? 'text-rose-400' : 'text-emerald-400'}>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Dual-port auto-negotiation enabled (Port 465 &amp; 587)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition cursor-pointer"
            >
              বাতিল (Cancel)
            </button>
            <button
              type="button"
              onClick={() => handleSaveAccount()}
              disabled={!isFormValid}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:from-blue-500 hover:via-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingAccount ? 'সেটিংস আপডেট করুন' : 'কানেক্ট ও সেভ করুন (Connect & Save)'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
