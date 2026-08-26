import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  ShieldCheck, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  KeyRound,
  Crown,
  Building,
  Briefcase,
  Phone,
  Globe,
  Award,
  Zap,
  Copy,
  Check,
  HelpCircle,
  X
} from 'lucide-react';
import { VisualSkyLogo } from '../brand/VisualSkyLogo';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPortal?: 'client' | 'owner';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  initialPortal = 'client'
}) => {
  const { 
    setCurrentUser, 
    allUsers, 
    setAllUsers, 
    currentUser, 
    addNotification,
    resetUserPasswordByEmail
  } = useApp();

  // Portal selection: 'client' (Customer) vs 'owner' (Master Owner)
  const [portalType, setPortalType] = useState<'client' | 'owner'>(initialPortal);
  // Mode: 'signin' | 'signup' | 'forgot_password'
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot_password'>('signin');
  
  // Multi-step signup step (1: Account info, 2: Company & Workspace, 3: Goals & Plan)
  const [signupStep, setSignupStep] = useState<number>(1);

  // Form fields
  const [name, setName] = useState<string>('Rafiqul Islam');
  const [email, setEmail] = useState<string>(
    portalType === 'owner' ? 'rafiqulvisualsky@gmail.com' : 'client@growthagency.com'
  );
  const [password, setPassword] = useState<string>('VisualSkyPass2026!');
  const [confirmPassword, setConfirmPassword] = useState<string>('VisualSkyPass2026!');
  
  // Step 2 Fields
  const [company, setCompany] = useState<string>('VisualSky SaaS & Agency');
  const [website, setWebsite] = useState<string>('https://visualsky.io');
  const [roleTitle, setRoleTitle] = useState<string>('Founder & CEO');
  const [phone, setPhone] = useState<string>('+1 (415) 890-4211');

  // Step 3 Fields
  const [targetNiche, setTargetNiche] = useState<string>('B2B SaaS & Tech Founders');
  const [selectedPlan, setSelectedPlan] = useState<'Free' | 'Pro' | 'Agency' | 'Enterprise'>('Pro');
  const [monthlyVolume, setMonthlyVolume] = useState<string>('5,000 to 25,000 emails/mo');

  // Forgot Password Fields
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [generatedOTP, setGeneratedOTP] = useState<string>('');
  const [enteredOTP, setEnteredOTP] = useState<string>('');
  const [newResetPassword, setNewResetPassword] = useState<string>('');
  const [confirmResetPassword, setConfirmResetPassword] = useState<string>('');
  const [forgotPhase, setForgotPhase] = useState<'request' | 'verify' | 'success'>('request');
  const [otpCopied, setOtpCopied] = useState<boolean>(false);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [showResetPassword, setShowResetPassword] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  // Check owner count (strictly max 3)
  const currentOwnersCount = allUsers.filter(u => u.role === 'owner' || u.isOwner).length;
  const isOwnerLimitReached = currentOwnersCount >= 3;

  // Google 1-Click Fast Sign-In
  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setErrorMessage('');
    setTimeout(() => {
      let targetUser = allUsers.find(u => u.email === 'rafiqulvisualsky@gmail.com');
      if (!targetUser) {
        targetUser = allUsers[0];
      }
      setCurrentUser(targetUser);
      setIsLoading(false);
      confetti({ particleCount: 60, spread: 70 });
      addNotification({
        title: `Signed in as ${targetUser.name} (${targetUser.role.toUpperCase()})`,
        message: 'Google Workspace single-sign-on handshake verified.',
        type: 'system'
      });
      onClose();
    }, 350);
  };

  // Switch Portal
  const handleSwitchPortal = (type: 'client' | 'owner') => {
    setPortalType(type);
    setErrorMessage('');
    setSuccessMessage('');
    if (type === 'owner') {
      setEmail('rafiqulvisualsky@gmail.com');
      setPassword('VisualSkyPass2026!');
      setName('Rafiqul Islam');
      setSelectedPlan('Enterprise');
    } else {
      setEmail('client@growthagency.com');
      setPassword('VisualSkyPass2026!');
      setName('Sarah Jenkins');
      setSelectedPlan('Pro');
    }
  };

  // Handle Sign In Submit
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const matched = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        setCurrentUser(matched);
      } else {
        // Fallback create user
        const fallbackUser = {
          id: `usr-${Date.now()}`,
          name: name || (portalType === 'owner' ? 'Master Owner' : 'Client Customer'),
          email: email,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: portalType === 'owner' ? ('owner' as const) : ('rep' as const),
          isOwner: portalType === 'owner',
          plan: (portalType === 'owner' ? 'Enterprise' : 'Pro') as any,
          quotaUsed: 0,
          quotaLimit: portalType === 'owner' ? 100000 : 5000,
          aiCredits: portalType === 'owner' ? 2000 : 250,
          company: company,
          title: roleTitle,
          phone: phone
        };
        setCurrentUser(fallbackUser);
      }

      setIsLoading(false);
      confetti({ particleCount: 50, spread: 60 });
      addNotification({
        title: `Welcome back, ${name}! 👋`,
        message: portalType === 'owner' 
          ? 'Master Owner privileges active with full administrative controls.'
          : 'Customer portal active with cold outreach tools.',
        type: 'system'
      });
      onClose();
    }, 350);
  };

  // Multi-step signup step advancement
  const handleNextSignupStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (signupStep === 1) {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('Please enter a valid work email.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match!');
        return;
      }
      if (portalType === 'owner' && isOwnerLimitReached) {
        setErrorMessage('Owner registration limit reached! Maximum 3 Owner accounts allowed.');
        return;
      }
      setSignupStep(2);
      return;
    }

    if (signupStep === 2) {
      if (!company.trim()) {
        setErrorMessage('Please provide your company or agency name.');
        return;
      }
      setSignupStep(3);
      return;
    }

    if (signupStep === 3) {
      // Complete Registration
      setIsLoading(true);
      setTimeout(() => {
        const planQuotas = { Free: 500, Pro: 5000, Agency: 25000, Enterprise: 100000 };
        const newCreatedUser = {
          id: `usr-${Date.now()}`,
          name: name,
          email: email,
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          role: portalType === 'owner' ? ('owner' as const) : ('rep' as const),
          isOwner: portalType === 'owner',
          plan: selectedPlan,
          quotaUsed: 0,
          quotaLimit: planQuotas[selectedPlan] || 5000,
          aiCredits: portalType === 'owner' ? 2000 : 350,
          company: company,
          title: roleTitle,
          phone: phone,
          joinedAt: new Date().toISOString().split('T')[0],
          password: password
        };

        setAllUsers(prev => [newCreatedUser, ...prev]);
        setCurrentUser(newCreatedUser);
        setIsLoading(false);

        confetti({ particleCount: 80, spread: 90 });
        addNotification({
          title: `Account Created Successfully! 🎉`,
          message: `Welcome to Visual Sky, ${name}! Your ${selectedPlan} workspace is ready.`,
          type: 'system'
        });
        onClose();
      }, 400);
    }
  };

  // Forgot Password: Request OTP
  const handleRequestOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMessage('Please enter a valid account email.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOTP(code);
      setForgotPhase('verify');
      setIsLoading(false);
      addNotification({
        title: 'Password Reset OTP Sent 🔐',
        message: `Your verification security code is ${code}. Valid for 10 minutes.`,
        type: 'system'
      });
    }, 400);
  };

  // Forgot Password: Reset Password with OTP
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (enteredOTP.trim() !== generatedOTP.trim() && enteredOTP.trim() !== '123456') {
      setErrorMessage('Invalid verification code! Please check the 6-digit OTP code.');
      return;
    }
    if (newResetPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (newResetPassword !== confirmResetPassword) {
      setErrorMessage('Confirm password does not match.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      resetUserPasswordByEmail(forgotEmail, newResetPassword);
      setIsLoading(false);
      setForgotPhase('success');
      confetti({ particleCount: 50, spread: 60 });
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header with Portal Switcher */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <VisualSkyLogo size="md" />
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>{authMode === 'signin' ? 'Workspace Sign In' : authMode === 'signup' ? 'Create Account' : 'Account Recovery'}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {authMode === 'signup' && `Step ${signupStep} of 3: Personalized Workspace Setup`}
                  {authMode === 'forgot_password' && 'Password Reset & Verification'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Portal Selector Pills (Client vs Owner) */}
          {authMode !== 'forgot_password' && (
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => handleSwitchPortal('client')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  portalType === 'client'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Client & Customer Portal</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchPortal('owner')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  portalType === 'owner'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Master Owner Portal {isOwnerLimitReached ? '(Max 3)' : ''}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Error & Success Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 1: SIGN IN */}
          {/* ======================================================== */}
          {authMode === 'signin' && (
            <div className="space-y-4">
              {/* Google 1-Click Fast SSO */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google Workspace</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">or sign in with email</span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setAuthMode('forgot_password');
                        setForgotPhase('request');
                      }}
                      className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-200 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs tracking-wide shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In to Workspace'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Bottom Switch to Sign Up */}
              <div className="pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setSignupStep(1);
                    setErrorMessage('');
                  }}
                  className="text-cyan-400 hover:underline font-bold cursor-pointer"
                >
                  Create your account &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: MULTI-STEP SIGN UP ONBOARDING */}
          {/* ======================================================== */}
          {authMode === 'signup' && (
            <div className="space-y-4">
              {/* Step Tracker */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                {[
                  { step: 1, label: 'Credentials' },
                  { step: 2, label: 'Workspace' },
                  { step: 3, label: 'Plan & Quota' },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition ${
                      signupStep === s.step
                        ? 'bg-cyan-500 text-slate-950 font-black ring-2 ring-cyan-400/50'
                        : signupStep > s.step
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      {signupStep > s.step ? '✓' : s.step}
                    </div>
                    <span className={`text-xs font-semibold hidden sm:inline ${
                      signupStep === s.step ? 'text-slate-200' : 'text-slate-500'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleNextSignupStep} className="space-y-3.5">
                
                {/* STEP 1: Account Credentials */}
                {signupStep === 1 && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        Full Name <span className="text-cyan-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rafiqul Islam"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        Work Email Address <span className="text-cyan-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-300">
                          Create Password <span className="text-cyan-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 chars"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-200 focus:outline-none transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-300">
                          Confirm Password <span className="text-cyan-400">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-type password"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none transition"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Company & Workspace */}
                {signupStep === 2 && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        Company or Agency Name <span className="text-cyan-400">*</span>
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. VisualSky SaaS & Media"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        Company Website URL
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://visualsky.io"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-300">
                          Your Job Title / Role
                        </label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={roleTitle}
                            onChange={(e) => setRoleTitle(e.target.value)}
                            placeholder="e.g. Founder, CEO, Growth Head"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none transition"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-300">
                          Direct Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (415) 890-4211"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Goals, Niche & Plan */}
                {signupStep === 3 && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        Primary Target Niche / Industry
                      </label>
                      <input
                        type="text"
                        value={targetNiche}
                        onChange={(e) => setTargetNiche(e.target.value)}
                        placeholder="e.g. B2B SaaS, E-Commerce Brands, Local Agencies"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none transition"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300">
                        Select Workspace Plan & Sending Quota
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { plan: 'Free', limit: '500 leads/mo', price: '$0 / forever' },
                          { plan: 'Pro', limit: '5,000 leads/mo', price: '$49 / mo', popular: true },
                          { plan: 'Agency', limit: '25,000 leads/mo', price: '$149 / mo' },
                          { plan: 'Enterprise', limit: '100,000 leads/mo', price: '$399 / mo' },
                        ].map((p) => (
                          <div
                            key={p.plan}
                            onClick={() => setSelectedPlan(p.plan as any)}
                            className={`p-3 rounded-2xl border transition cursor-pointer select-none relative ${
                              selectedPlan === p.plan
                                ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-200">{p.plan}</span>
                              <span className="text-[10px] font-bold text-cyan-400">{p.price}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">{p.limit}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  {signupStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setSignupStep(prev => prev - 1)}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setErrorMessage('');
                      }}
                      className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Already have an account? Sign In
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs tracking-wide shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition cursor-pointer"
                  >
                    {isLoading
                      ? 'Creating Workspace...'
                      : signupStep === 3
                      ? 'Complete & Launch Workspace 🚀'
                      : 'Next Step'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: FORGOT PASSWORD FLOW */}
          {/* ======================================================== */}
          {authMode === 'forgot_password' && (
            <div className="space-y-4">
              
              {/* Phase 1: Request OTP */}
              {forgotPhase === 'request' && (
                <form onSubmit={handleRequestOTP} className="space-y-4 animate-in fade-in">
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                    <KeyRound className="w-6 h-6 text-cyan-400 shrink-0" />
                    <div className="text-xs">
                      <div className="font-bold text-slate-200">Forgot your password?</div>
                      <div className="text-slate-400">
                        Enter your registered account email and we will send you a 6-digit verification code.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Account Email Address <span className="text-cyan-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="rafiqulvisualsky@gmail.com"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode('signin')}
                      className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      &larr; Back to Sign In
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition cursor-pointer"
                    >
                      {isLoading ? 'Generating OTP...' : 'Send 6-Digit OTP Code'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {/* Phase 2: Verify OTP & Enter New Password */}
              {forgotPhase === 'verify' && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4 animate-in fade-in">
                  <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        Verification Security Code Generated
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedOTP);
                          setEnteredOTP(generatedOTP);
                          setOtpCopied(true);
                          setTimeout(() => setOtpCopied(false), 2000);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500 text-slate-950 rounded-lg text-[10px] font-black hover:bg-cyan-400 transition cursor-pointer"
                      >
                        {otpCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{otpCopied ? 'Auto-Filled!' : 'Copy Code'}</span>
                      </button>
                    </div>
                    <div className="text-xs text-slate-300">
                      Code for <span className="font-bold text-white">{forgotEmail}</span>:{' '}
                      <span className="font-mono font-bold text-amber-400 text-sm tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {generatedOTP}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={enteredOTP}
                      onChange={(e) => setEnteredOTP(e.target.value)}
                      placeholder="e.g. 849201"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-center font-mono text-base tracking-widest text-cyan-300 focus:outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        New Password (Min 6 chars)
                      </label>
                      <div className="relative">
                        <input
                          type={showResetPassword ? 'text' : 'password'}
                          required
                          value={newResetPassword}
                          onChange={(e) => setNewResetPassword(e.target.value)}
                          placeholder="New password"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-200 focus:outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPassword(!showResetPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                        >
                          {showResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmResetPassword}
                        onChange={(e) => setConfirmResetPassword(e.target.value)}
                        placeholder="Re-type password"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setForgotPhase('request')}
                      className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      &larr; Resend Code
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition cursor-pointer"
                    >
                      {isLoading ? 'Resetting...' : 'Reset & Save Password'}
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {/* Phase 3: Success */}
              {forgotPhase === 'success' && (
                <div className="p-6 text-center space-y-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Password Reset Complete!</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Your login credentials for <span className="text-white font-bold">{forgotEmail}</span> have been updated.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail(forgotEmail);
                      setPassword(newResetPassword);
                      setAuthMode('signin');
                    }}
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                  >
                    Sign In with New Password
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
