import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Crown,
  Phone,
  Check,
  Copy,
  CreditCard,
  Sparkles,
  X,
  HelpCircle,
  KeyRound,
  RefreshCw,
  Zap,
  ExternalLink
} from 'lucide-react';
import { VisualSkyLogo } from '../brand/VisualSkyLogo';
import { 
  signUpWithSupabase, 
  signInWithSupabase, 
  signInWithGoogle, 
  resetPasswordWithSupabase,
  isSupabaseConfigured 
} from '../../lib/supabase';
import { UserAccount, ClientPaymentInfo } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPortal?: 'client' | 'agency';
}

// BDT Subscription Plans for Clients (Strictly BDT ৳ - No USD Default)
export const BDT_CLIENT_PLANS = [
  {
    id: 'starter',
    name: 'Starter Growth',
    priceBDT: 1999,
    priceDisplay: '৳১,৯৯৯',
    billingCycle: '/ month',
    planCode: 'Pro' as const,
    quotaLimit: 1500,
    aiCredits: 500,
    maxSmtp: 3,
    description: 'Perfect for early-stage founders & solo outreach consultants.',
    features: [
      '1,500 Verified Outbound Leads',
      '3 Dedicated SMTP Relay Slots',
      'Smart Unified Inbox & Follow-ups',
      'Standard Lead Verification'
    ]
  },
  {
    id: 'scale',
    name: 'Scale Business',
    priceBDT: 4999,
    priceDisplay: '৳৪,৯৯৯',
    billingCycle: '/ month',
    planCode: 'Agency' as const,
    quotaLimit: 10000,
    aiCredits: 2500,
    maxSmtp: 10,
    isPopular: true,
    description: 'High-growth outbound engine with automated follow-ups & AI.',
    features: [
      '10,000 Verified Outbound Leads',
      '10 SMTP Multi-Domain Relays',
      'Gemini 3.7 AI Outreach Copilot (2,500 Credits)',
      '7d / 14d / 30d Automated Sequences',
      '99.8% Primary Inbox Landing Radar'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Suite',
    priceBDT: 9999,
    priceDisplay: '৳৯,৯৯৯',
    billingCycle: '/ month',
    planCode: 'Enterprise' as const,
    quotaLimit: 35000,
    aiCredits: 10000,
    maxSmtp: 25,
    description: 'Full-scale multi-domain deliverability infrastructure.',
    features: [
      '35,000 Verified Outbound Leads',
      '25 Dedicated Relay Nodes (Gmail/SES/Hostinger)',
      'Unlimited AI Copilot & Lead Miner',
      '24/7 Priority Deliverability Monitoring'
    ]
  }
];

// App Owner's Linked Payout Accounts in Bangladesh (BDT)
export const OWNER_PAYOUT_ACCOUNTS = {
  bKash: {
    gatewayName: 'bKash (বিকাশ)',
    number: '01712-345678',
    cleanNumber: '01712345678',
    type: 'Merchant / Personal (Send Money & Payment)',
    counter: '01',
    reference: 'VSKY',
    color: '#E2136E',
    bgColor: 'bg-[#E2136E]/10',
    borderColor: 'border-[#E2136E]/30',
    textColor: 'text-[#E2136E]',
    instruction: 'Go to your bKash App > Select "Send Money" or "Make Payment" > Enter Owner Account Number below > Use Reference: VSKY.'
  },
  Nagad: {
    gatewayName: 'Nagad (নগদ)',
    number: '01812-345678',
    cleanNumber: '01812345678',
    type: 'Merchant Pay / Send Money',
    counter: '01',
    reference: 'VSKY',
    color: '#F7941D',
    bgColor: 'bg-[#F7941D]/10',
    borderColor: 'border-[#F7941D]/30',
    textColor: 'text-[#F7941D]',
    instruction: 'Go to your Nagad App > Select "Send Money" or "Merchant Pay" > Enter Owner Account Number below > Use Reference: VSKY.'
  },
  Rocket: {
    gatewayName: 'Rocket DBBL (রকেট)',
    number: '01912-345678-9',
    cleanNumber: '019123456789',
    type: 'Merchant / Bill Pay',
    counter: '01',
    reference: 'VSKY',
    color: '#8C3494',
    bgColor: 'bg-[#8C3494]/10',
    borderColor: 'border-[#8C3494]/30',
    textColor: 'text-[#a855f7]',
    instruction: 'Go to your Rocket App or dial *322# > Select "Merchant Pay" or "Bill Pay" > Enter Account Number > Use Reference: VSKY.'
  }
};

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
    setActiveTab,
    addNotification,
    resetUserPasswordByEmail
  } = useApp();

  // Wizard Step: 1 = Role Selection, 2 = Credentials & Authentication (or Payment)
  const [step, setStep] = useState<1 | 2>(1);

  // Portal Type: 'client' | 'agency'
  const [portalType, setPortalType] = useState<'client' | 'agency'>(initialPortal);

  // Auth Mode: 'signin' | 'signup' | 'forgot_password'
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot_password'>('signin');

  // Sub-step for client signup (1 = credentials, 2 = BDT payment)
  const [clientSignupSubStep, setClientSignupSubStep] = useState<1 | 2>(1);

  // Required Form Fields (Simplified - NO Organization Setup!)
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Password visibility
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Client Payment State (BDT ৳)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('scale');
  const [selectedGateway, setSelectedGateway] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [senderWalletNumber, setSenderWalletNumber] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [copiedNumber, setCopiedNumber] = useState<boolean>(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotOtp, setForgotOtp] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [newResetPassword, setNewResetPassword] = useState<string>('');
  const [confirmResetPassword, setConfirmResetPassword] = useState<string>('');
  const [forgotPhase, setForgotPhase] = useState<'request' | 'verify' | 'success'>('request');

  // Status & Feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Count existing agency accounts
  const agencyUsers = allUsers.filter(u => u.role === 'agency' || u.role === 'owner' || Boolean(u.isOwner));
  const agencyCount = agencyUsers.length;
  const isAgencyMaxedOut = agencyCount >= 3;

  // Initialize or reset fields when portalType or authMode changes
  useEffect(() => {
    if (initialPortal) {
      setPortalType(initialPortal);
    }
  }, [initialPortal]);

  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
  }, [portalType, authMode, step, clientSignupSubStep]);

  if (!isOpen) return null;

  // Selected plan details
  const currentPlan = BDT_CLIENT_PLANS.find(p => p.id === selectedPlanId) || BDT_CLIENT_PLANS[1];
  const activePayout = OWNER_PAYOUT_ACCOUNTS[selectedGateway];

  // Helper: Copy Owner Payout Account
  const handleCopyPayoutNumber = (numberToCopy: string) => {
    navigator.clipboard.writeText(numberToCopy);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  // Helper: Demo autofill for faster testing
  const handleQuickDemoFill = (type: 'client' | 'agency', mode: 'signin' | 'signup') => {
    setErrorMessage('');
    if (mode === 'signin') {
      if (type === 'agency') {
        setEmail('admin@visualsky.io');
        setPassword('VisualSkyPass2026!');
      } else {
        setEmail('client@growthagency.com');
        setPassword('VisualSkyPass2026!');
      }
    } else {
      if (type === 'agency') {
        setFullName('Rafiqul Agency Master');
        setEmail(`agency.${Date.now().toString().slice(-4)}@visualsky.io`);
        setPhone('+880 1712-345678');
        setPassword('VisualSkyPass2026!');
        setConfirmPassword('VisualSkyPass2026!');
      } else {
        setFullName('Tanvir Ahmed');
        setEmail(`tanvir.${Date.now().toString().slice(-4)}@b2bscale.com`);
        setPhone('01719876543');
        setPassword('VisualSkyPass2026!');
        setConfirmPassword('VisualSkyPass2026!');
        setSenderWalletNumber('01719876543');
        setTransactionId(`BKA${Math.random().toString(36).substring(2, 9).toUpperCase()}`);
      }
    }
  };

  // Generate a realistic test TrxID for client payment verification
  const handleGenerateTestTrxId = () => {
    const prefix = selectedGateway === 'bKash' ? 'BKA' : selectedGateway === 'Nagad' ? 'NGD' : 'RCK';
    const randomCode = Math.random().toString(36).substring(2, 9).toUpperCase();
    setTransactionId(`${prefix}${randomCode}`);
    if (!senderWalletNumber) {
      setSenderWalletNumber(phone || '01711223344');
    }
  };

  // Handle Google 1-Click Sign In / Sign Up
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage('');

    // If attempting agency registration, check 3-seat limit
    if (authMode === 'signup' && portalType === 'agency' && isAgencyMaxedOut) {
      setIsLoading(false);
      setErrorMessage('⛔ Agency registration limit reached. Maximum 3 Agency Master seats have been filled.');
      return;
    }

    try {
      const isAgency = portalType === 'agency';

      // For client signup with Google, verify payment info is attached
      let paymentRecord: ClientPaymentInfo | undefined = undefined;
      if (!isAgency && authMode === 'signup') {
        paymentRecord = {
          method: selectedGateway,
          planName: `${currentPlan.name} (${currentPlan.priceDisplay}/mo)`,
          amountBDT: currentPlan.priceBDT,
          trxId: transactionId || `BKA${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          senderPhone: senderWalletNumber || phone || '+880 1700-000000',
          paymentDate: new Date().toISOString().split('T')[0],
          status: 'verified',
          ownerPayoutAccount: `${activePayout.number} (${activePayout.gatewayName})`
        };
      }

      const res = await signInWithGoogle(portalType, {
        name: fullName || (isAgency ? 'Rafiqul (Agency Master)' : 'Rafiqul Islam'),
        email: email || (isAgency ? 'admin@visualsky.io' : 'rafiqulvisualsky@gmail.com'),
        phone: phone || '+880 1712-345678',
        paymentInfo: paymentRecord
      });

      if (!res.success && res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
        return;
      }

      // If redirecting via real Supabase OAuth
      if (res.isRedirecting) {
        return;
      }

      // Build or update authenticated user
      const googleUser: UserAccount = {
        id: res.user?.id || `usr-google-${Date.now()}`,
        name: res.user?.user_metadata?.name || (isAgency ? 'Rafiqul (Agency Master)' : 'Rafiqul Islam'),
        email: res.user?.email || (isAgency ? 'admin@visualsky.io' : 'rafiqulvisualsky@gmail.com'),
        avatar: isAgency
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: portalType,
        isOwner: isAgency,
        plan: isAgency ? 'Enterprise' : currentPlan.planCode,
        bdtPlanLabel: isAgency ? 'Agency Master (Free Unlimited)' : `${currentPlan.name} (${currentPlan.priceDisplay}/mo)`,
        quotaUsed: 0,
        quotaLimit: isAgency ? 50000 : currentPlan.quotaLimit,
        aiCredits: isAgency ? 10000 : currentPlan.aiCredits,
        phone: res.user?.user_metadata?.phone || phone || '+880 1712-345678',
        paymentInfo: paymentRecord,
        joinedAt: new Date().toISOString().split('T')[0],
        supabaseId: res.user?.id
      };

      setAllUsers(prev => {
        const filtered = prev.filter(u => u.email.toLowerCase() !== googleUser.email.toLowerCase());
        return [googleUser, ...filtered];
      });
      setCurrentUser(googleUser);

      // Auto-redirection as strictly requested
      if (portalType === 'agency') {
        setActiveTab('owner');
      } else {
        setActiveTab('dashboard');
      }

      setIsLoading(false);
      addNotification({
        title: `Google Sign In Successful! 🎉`,
        message: isAgency
          ? `Welcome to Agency Master Dashboard (Role: agency).`
          : `Welcome to Client Workspace (Role: client, Plan: ${currentPlan.name}).`,
        type: 'system'
      });
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Google authentication encountered an issue.');
    }
  };

  // Handle Standard Email & Password Sign In
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signInWithSupabase(email.trim(), password, portalType);

      if (!result.success && result.error) {
        setErrorMessage(result.error);
        setIsLoading(false);
        return;
      }

      const assignedRole: 'client' | 'agency' = result.role || portalType;
      const isAgency = assignedRole === 'agency';

      // Check if user already exists in local accounts list
      const matched = allUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      const authenticatedUser: UserAccount = matched
        ? { ...matched, role: assignedRole, isOwner: isAgency }
        : {
            id: result.user?.id || `usr-${Date.now()}`,
            name: result.user?.user_metadata?.name || (isAgency ? 'Agency Master Admin' : 'Client Partner'),
            email: email.trim(),
            avatar: isAgency
              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            role: assignedRole,
            isOwner: isAgency,
            plan: (result.user?.user_metadata?.plan || (isAgency ? 'Enterprise' : 'Pro')) as any,
            quotaUsed: 0,
            quotaLimit: isAgency ? 50000 : 5000,
            aiCredits: isAgency ? 10000 : 2500,
            phone: result.user?.user_metadata?.phone || '+880 1712-345678',
            supabaseId: result.user?.id
          };

      setCurrentUser(authenticatedUser);
      setAllUsers(prev => {
        const filtered = prev.filter(u => u.email.toLowerCase() !== authenticatedUser.email.toLowerCase());
        return [authenticatedUser, ...filtered];
      });

      // Auto-redirection as strictly requested
      if (assignedRole === 'agency') {
        setActiveTab('owner'); // Agency Master Dashboard
      } else {
        setActiveTab('dashboard'); // Client Dashboard
      }

      setIsLoading(false);
      addNotification({
        title: `Welcome back, ${authenticatedUser.name}! 👋`,
        message: assignedRole === 'agency'
          ? 'Agency Master Dashboard loaded with full administrative authority.'
          : 'Client Workspace loaded. Ready for cold email outreach.',
        type: 'system'
      });
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Sign in failed. Please verify your email and password.');
    }
  };

  // Validate Step 2A (Required Signup Fields)
  const validateSignupCredentials = (): boolean => {
    if (!fullName.trim()) {
      setErrorMessage('Full Name is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please provide a valid email address.');
      return false;
    }
    const cleanPhone = phone.replace(/[\s\-()+]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage('Please enter a valid phone number (at least 8 digits).');
      return false;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both passwords match.');
      return false;
    }
    return true;
  };

  // Handle Agency Signup (Free, Max 3 Seats)
  const handleAgencySignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Enforce strict 3-seat limit for Agency Master
    if (isAgencyMaxedOut) {
      setErrorMessage('⛔ Agency Registration Limit Reached: Maximum 3 Agency Master accounts are permitted. All seats are occupied.');
      return;
    }

    if (!validateSignupCredentials()) return;

    setIsLoading(true);

    try {
      const result = await signUpWithSupabase(email.trim(), password, {
        name: fullName.trim(),
        role: 'agency',
        phone: phone.trim(),
        plan: 'Enterprise',
        bdtPlanLabel: 'Agency Master Admin (Free Tier)'
      });

      if (!result.success && result.error) {
        setErrorMessage(result.error);
        setIsLoading(false);
        return;
      }

      const newAgencyUser: UserAccount = {
        id: result.user?.id || `usr-agency-${Date.now()}`,
        name: fullName.trim(),
        email: email.trim(),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'agency',
        isOwner: true,
        plan: 'Enterprise',
        bdtPlanLabel: 'Agency Master Admin (Free Tier)',
        quotaUsed: 0,
        quotaLimit: 50000,
        aiCredits: 10000,
        phone: phone.trim(),
        joinedAt: new Date().toISOString().split('T')[0],
        supabaseId: result.user?.id
      };

      setAllUsers(prev => [newAgencyUser, ...prev]);
      setCurrentUser(newAgencyUser);

      // Auto-redirect to Agency Master Dashboard
      setActiveTab('owner');

      setIsLoading(false);
      addNotification({
        title: `Agency Master Account Created! 👑`,
        message: `Welcome ${fullName}! You have 100% Free Access to the Agency Master Dashboard. Seat: ${agencyCount + 1}/3.`,
        type: 'system'
      });
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Failed to register Agency account.');
    }
  };

  // Handle Client Step 1 Next: Move to BDT Payment
  const handleClientProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!validateSignupCredentials()) return;
    if (!senderWalletNumber) {
      setSenderWalletNumber(phone.trim());
    }
    setClientSignupSubStep(2);
  };

  // Handle Client Payment & Final Activation Submit (Paid Access via BDT Gateways)
  const handleClientPaymentAndActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!senderWalletNumber.trim() || senderWalletNumber.replace(/[\s\-()+]/g, '').length < 8) {
      setErrorMessage('Please enter the Sender Mobile Number used for the payment.');
      return;
    }
    if (!transactionId.trim() || transactionId.trim().length < 6) {
      setErrorMessage('Please enter a valid Transaction ID (TrxID) received from your bKash/Nagad/Rocket SMS.');
      return;
    }

    setIsLoading(true);

    try {
      const paymentInfo: ClientPaymentInfo = {
        method: selectedGateway,
        planName: `${currentPlan.name} (${currentPlan.priceDisplay}/mo)`,
        amountBDT: currentPlan.priceBDT,
        trxId: transactionId.trim().toUpperCase(),
        senderPhone: senderWalletNumber.trim(),
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'verified',
        ownerPayoutAccount: `${activePayout.number} (${activePayout.gatewayName})`
      };

      const result = await signUpWithSupabase(email.trim(), password, {
        name: fullName.trim(),
        role: 'client',
        phone: phone.trim(),
        plan: currentPlan.planCode,
        bdtPlanLabel: `${currentPlan.name} (${currentPlan.priceDisplay}/mo)`,
        paymentInfo
      });

      if (!result.success && result.error) {
        setErrorMessage(result.error);
        setIsLoading(false);
        return;
      }

      const newClientUser: UserAccount = {
        id: result.user?.id || `usr-client-${Date.now()}`,
        name: fullName.trim(),
        email: email.trim(),
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: 'client',
        isOwner: false,
        plan: currentPlan.planCode,
        bdtPlanLabel: `${currentPlan.name} (${currentPlan.priceDisplay}/mo)`,
        quotaUsed: 0,
        quotaLimit: currentPlan.quotaLimit,
        aiCredits: currentPlan.aiCredits,
        phone: phone.trim(),
        paymentInfo,
        joinedAt: new Date().toISOString().split('T')[0],
        supabaseId: result.user?.id
      };

      setAllUsers(prev => [newClientUser, ...prev]);
      setCurrentUser(newClientUser);

      // Auto-redirect to Client Dashboard
      setActiveTab('dashboard');

      setIsLoading(false);
      addNotification({
        title: `Client Account Activated! 🚀`,
        message: `Payment verified (${selectedGateway}: ${transactionId.trim().toUpperCase()}). Welcome to Visual Sky!`,
        type: 'system'
      });
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Payment verification failed. Please check the TrxID.');
    }
  };

  // Forgot Password Flow
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMessage('Please enter your registered account email.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordWithSupabase(forgotEmail.trim());
      const demoOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(demoOtp);
      setForgotOtp(demoOtp); // pre-populate for frictionless verification
      setForgotPhase('verify');
      setIsLoading(false);
      setSuccessMessage(`Reset code generated for ${forgotEmail.trim()}. Code: ${demoOtp}`);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Could not send reset code.');
    }
  };

  const handleVerifyOtpAndChangePass = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (forgotOtp.trim() !== generatedOtp.trim()) {
      setErrorMessage('Invalid verification code. Please check and try again.');
      return;
    }
    if (newResetPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newResetPassword !== confirmResetPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    const resetSuccess = resetUserPasswordByEmail(forgotEmail.trim(), newResetPassword);
    if (!resetSuccess) {
      setErrorMessage('No user account found matching this email address.');
      return;
    }

    setForgotPhase('success');
    addNotification({
      title: 'Password Successfully Reset 🔑',
      message: `Password updated for ${forgotEmail}. You can now sign in with your new credentials.`,
      type: 'system'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <VisualSkyLogo size="sm" showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-100">Visual Sky</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  v2.8
                </span>
                {isSupabaseConfigured && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Supabase Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {step === 1 
                  ? 'Step 1 of 2: Select Workspace Role'
                  : authMode === 'signin' 
                    ? `Sign In to ${portalType === 'agency' ? 'Agency Master' : 'Client Portal'}`
                    : authMode === 'signup'
                      ? portalType === 'agency'
                        ? 'Step 2: Agency Master Free Registration'
                        : clientSignupSubStep === 1
                          ? 'Step 2A: Client Account Details'
                          : 'Step 2B: BDT Payment & Activation'
                      : 'Password Recovery'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error & Success Alerts */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mx-5 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <div className="flex-1">{successMessage}</div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: ROLE SELECTION (Client vs Agency)                                   */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-lg sm:text-xl font-black text-slate-100">
                Choose Your Workspace Role
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Select your account type to proceed with tailored authentication, quotas, and dashboard views.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              
              {/* Option A: Client Portal */}
              <div 
                onClick={() => setPortalType('client')}
                className={`relative p-4 rounded-xl border-2 transition cursor-pointer text-left flex flex-col justify-between ${
                  portalType === 'client'
                    ? 'bg-cyan-950/30 border-cyan-500/80 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {portalType === 'client' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
                <div className="space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-slate-100">Client Portal</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        Paid Access (BDT ৳)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      For businesses, founders & agencies conducting high-converting cold email outreach.
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Included:</div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Outbound SMTPs & Spam Audit</span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Gemini 3.7 AI Copilot & Miner</span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>bKash, Nagad & Rocket Gateways</span>
                  </div>
                </div>
              </div>

              {/* Option B: Agency Master */}
              <div 
                onClick={() => setPortalType('agency')}
                className={`relative p-4 rounded-xl border-2 transition cursor-pointer text-left flex flex-col justify-between ${
                  portalType === 'agency'
                    ? 'bg-amber-950/30 border-amber-500/80 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {portalType === 'agency' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
                <div className="space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-slate-100">Agency Master</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        100% Free
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Master administrative control center to manage all client accounts, quotas, and payouts.
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Seat Quota:</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isAgencyMaxedOut 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {agencyCount} / 3 Claimed
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Master Command Center Dashboard</span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Client Feature Toggle & Quota Control</span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Direct Merchant Payout Routing</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mode Switch (Sign In vs Sign Up) */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Current selection: <strong className="text-slate-200 capitalize">{portalType} Portal</strong>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    authMode === 'signin'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    authMode === 'signup'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={() => {
                setErrorMessage('');
                // If agency signup and full, warn immediately
                if (authMode === 'signup' && portalType === 'agency' && isAgencyMaxedOut) {
                  setErrorMessage('⛔ Agency registration limit reached. All 3 Agency Master seats are filled.');
                }
                setStep(2);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              <span>Continue to {authMode === 'signin' ? 'Sign In' : 'Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: CREDENTIALS & AUTHENTICATION / PAYMENT                             */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="p-5 sm:p-6 space-y-4">
            
            {/* Top Navigation Bar: Back & Role Switch */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => {
                  setErrorMessage('');
                  if (authMode === 'signup' && portalType === 'client' && clientSignupSubStep === 2) {
                    setClientSignupSubStep(1);
                  } else {
                    setStep(1);
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  portalType === 'agency' 
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                }`}>
                  {portalType === 'agency' ? '👑 Agency Master' : '💼 Client Workspace'}
                </span>
                <button
                  onClick={() => setStep(1)}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Quick Demo Autofill Bar */}
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-[11px]">
              <span className="text-slate-400">Testing preview?</span>
              <button
                type="button"
                onClick={() => handleQuickDemoFill(portalType, authMode === 'signup' ? 'signup' : 'signin')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Autofill {portalType} test {authMode === 'signup' ? 'signup' : 'credentials'}</span>
              </button>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* SUB-FLOW 1: SIGN IN (Clients & Agency Admins)                         */}
            {/* --------------------------------------------------------------------- */}
            {authMode === 'signin' && (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                
                {/* Google SSO Button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2.5 transition cursor-pointer shadow"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google Account</span>
                </button>

                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-slate-800 w-full"></div>
                  <span className="bg-slate-900 px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    or continue with email
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Work Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setAuthMode('forgot_password')}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-600/20 disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Sign In & Launch {portalType === 'agency' ? 'Agency Master' : 'Workspace'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <span className="text-xs text-slate-400">Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    Sign Up Now
                  </button>
                </div>
              </form>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* SUB-FLOW 2: AGENCY MASTER SIGN UP (Free, Strictly Max 3 Accounts)      */}
            {/* --------------------------------------------------------------------- */}
            {authMode === 'signup' && portalType === 'agency' && (
              <div>
                {/* Agency Limit Check */}
                {isAgencyMaxedOut ? (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/40 rounded-xl space-y-3 text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-slate-100">
                        Agency Registration Limit Reached
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                        Maximum <strong>3 Agency Master seats</strong> have been filled ({agencyCount}/3). 
                        Further agency registrations are blocked by system policy.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setAuthMode('signin')}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
                      >
                        Sign In Existing Agency
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPortalType('client');
                          setStep(2);
                        }}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition"
                      >
                        Register as Client
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleAgencySignupSubmit} className="space-y-3.5">
                    
                    {/* Free Badge */}
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300">
                      <div className="flex items-center gap-2 font-bold">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>Agency Master Access: 100% Free</span>
                      </div>
                      <span className="text-[11px] font-mono bg-amber-500/20 px-2 py-0.5 rounded font-bold">
                        Seat {agencyCount + 1} of 3 Available
                      </span>
                    </div>

                    {/* Google SSO Button */}
                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2.5 transition cursor-pointer shadow"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google Account</span>
                    </button>

                    <div className="relative flex items-center justify-center my-1">
                      <div className="border-t border-slate-800 w-full"></div>
                      <span className="bg-slate-900 px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                        or register with email
                      </span>
                    </div>

                    {/* ONLY 5 REQUIRED FIELDS: Name, Email, Phone, Password, ConfirmPassword */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Rafiqul Islam"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@youragency.com"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+880 1712-345678"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Password *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
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

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Confirm Password *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                          >
                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Crown className="w-4 h-4" />
                          <span>Create Free Agency Master Account</span>
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1">
                      <span className="text-xs text-slate-400">Already registered as Agency? </span>
                      <button
                        type="button"
                        onClick={() => setAuthMode('signin')}
                        className="text-xs text-amber-400 hover:text-amber-300 font-bold"
                      >
                        Sign In
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* SUB-FLOW 3A: CLIENT SIGN UP - STEP 1 (Account Credentials Only)        */}
            {/* --------------------------------------------------------------------- */}
            {authMode === 'signup' && portalType === 'client' && clientSignupSubStep === 1 && (
              <form onSubmit={handleClientProceedToPayment} className="space-y-3.5">
                
                {/* Notice: Paid Access */}
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-between text-xs text-cyan-300">
                  <span className="font-bold flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span>Client Workspace: Step 1 of 2</span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    Payment in BDT (৳) Next
                  </span>
                </div>

                {/* Google SSO Button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2.5 transition cursor-pointer shadow"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google Account</span>
                </button>

                <div className="relative flex items-center justify-center my-1">
                  <div className="border-t border-slate-800 w-full"></div>
                  <span className="bg-slate-900 px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    or enter required details
                  </span>
                </div>

                {/* REQUIRED FIELDS ONLY: Full Name, Email, Phone, Password, Confirm Password */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Phone Number * (Required for Payment Verification)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX or +880..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
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

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition cursor-pointer mt-2"
                >
                  <span>Proceed to Subscription Payment (BDT ৳)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-1">
                  <span className="text-xs text-slate-400">Already have a client account? </span>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* SUB-FLOW 3B: CLIENT SIGN UP - STEP 2 (BDT ৳ Payment & Direct Payout)  */}
            {/* --------------------------------------------------------------------- */}
            {authMode === 'signup' && portalType === 'client' && clientSignupSubStep === 2 && (
              <form onSubmit={handleClientPaymentAndActivate} className="space-y-4">
                
                <div className="text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-cyan-400" />
                      <span>Complete BDT Payment to Activate</span>
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Paid Access Only
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Select your monthly plan and send payment directly to the App Owner's merchant account.
                  </p>
                </div>

                {/* Plan Selector (BDT ৳) */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-300">
                    1. Select Subscription Plan:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {BDT_CLIENT_PLANS.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer text-left relative ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          {plan.isPopular && (
                            <span className="absolute -top-2 right-2 px-1.5 py-0.2 text-[8px] font-black uppercase bg-cyan-500 text-slate-950 rounded shadow">
                              Popular
                            </span>
                          )}
                          <div className="font-bold text-xs truncate">{plan.name}</div>
                          <div className="text-sm font-black text-cyan-300 font-mono mt-0.5">
                            {plan.priceDisplay}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {plan.quotaLimit.toLocaleString()} leads
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gateway Selector (bKash, Nagad, Rocket) */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-300">
                    2. Select Bangladeshi Payment Method:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['bKash', 'Nagad', 'Rocket'] as const).map((gateway) => {
                      const isSelected = selectedGateway === gateway;
                      const gDetails = OWNER_PAYOUT_ACCOUNTS[gateway];
                      return (
                        <button
                          key={gateway}
                          type="button"
                          onClick={() => setSelectedGateway(gateway)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? `${gDetails.bgColor} ${gDetails.borderColor} ${gDetails.textColor} ring-1 ring-offset-0 ring-current`
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span>{gateway}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Owner Linked Payout Box */}
                <div className={`p-3.5 rounded-xl border ${activePayout.bgColor} ${activePayout.borderColor} space-y-2.5`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Owner Payout Account:</span>
                    <span className={`font-bold ${activePayout.textColor}`}>{activePayout.gatewayName}</span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Send Amount: {currentPlan.priceDisplay}</div>
                      <div className="text-sm font-mono font-black text-slate-100 tracking-wider">
                        {activePayout.number}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyPayoutNumber(activePayout.cleanNumber)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedNumber ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    💡 {activePayout.instruction}
                  </p>
                </div>

                {/* Verification Fields: Sender Phone & TrxID */}
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Sender Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={senderWalletNumber}
                        onChange={(e) => setSenderWalletNumber(e.target.value)}
                        placeholder="e.g. 017XXXXXXXX"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-300">
                          Transaction ID (TrxID) *
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateTestTrxId}
                          className="text-[10px] text-cyan-400 hover:underline"
                        >
                          Generate Demo TrxID
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. BKA79X20LK"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Payment & Activate */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm {currentPlan.priceDisplay} Payment & Activate Client Portal</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* --------------------------------------------------------------------- */}
            {/* SUB-FLOW 4: FORGOT PASSWORD RECOVERY                                   */}
            {/* --------------------------------------------------------------------- */}
            {authMode === 'forgot_password' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <span>Reset Your Password</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Recover access to your {portalType} account using your registered work email.
                  </p>
                </div>

                {forgotPhase === 'request' && (
                  <form onSubmit={handleRequestPasswordReset} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Registered Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="you@domain.com"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Generate Reset OTP Code</span>
                      )}
                    </button>
                  </form>
                )}

                {forgotPhase === 'verify' && (
                  <form onSubmit={handleVerifyOtpAndChangePass} className="space-y-3.5">
                    <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-300 flex items-center justify-between">
                      <span>Verification code: <strong className="font-mono">{generatedOtp}</strong></span>
                      <button
                        type="button"
                        onClick={() => setForgotOtp(generatedOtp)}
                        className="text-[11px] text-cyan-400 hover:underline"
                      >
                        Auto-fill
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Enter 6-Digit OTP Code
                      </label>
                      <input
                        type="text"
                        required
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value)}
                        placeholder="e.g. 123456"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono tracking-widest text-center text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={newResetPassword}
                          onChange={(e) => setNewResetPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmResetPassword}
                          onChange={(e) => setConfirmResetPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Update Password</span>
                    </button>
                  </form>
                )}

                {forgotPhase === 'success' && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">Password Successfully Updated!</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        You can now sign in with your new credentials.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setForgotPhase('request');
                      }}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                    >
                      Return to Sign In
                    </button>
                  </div>
                )}

                {forgotPhase !== 'success' && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode('signin')}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      &larr; Remember your password? Back to Sign In
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
