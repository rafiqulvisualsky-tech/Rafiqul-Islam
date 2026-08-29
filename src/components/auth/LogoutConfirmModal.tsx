import React from 'react';
import { LogOut, AlertTriangle, X, Shield, ArrowRight } from 'lucide-react';
import { UserAccount } from '../../types';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentUser: UserAccount;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentUser
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#0b111e] border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl shadow-rose-950/20 text-slate-100 relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-500/10">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Confirm Logout</span>
              <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                লগআউট নিশ্চিতকরণ
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Are you sure you want to end your active session?
            </p>
          </div>
        </div>

        {/* Current Active Account Card */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl mb-4 flex items-center gap-3">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-9 h-9 rounded-lg object-cover ring-1 ring-cyan-500/40 shrink-0" 
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</div>
            <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-800 text-cyan-300 border border-slate-700 shrink-0">
            {currentUser.role}
          </span>
        </div>

        {/* Warning / Explanation Text */}
        <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl mb-5 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>লগআউট করার পর পুনরায় সাইন ইন করতে হবে</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Logging out will safely terminate your session. You will be redirected to the Sign In screen where you can log back in with your credentials anytime.
          </p>
        </div>

        {/* Action Buttons: Yes / No */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>No, Stay Signed In</span>
            <span className="text-[10px] text-slate-400 font-normal">(না, বাতিল)</span>
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Yes, Log Out</span>
            <span className="text-[10px] text-rose-200 font-normal">(লগআউট)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
