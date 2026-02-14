'use client';

import { X, Sparkles, Check, Zap } from 'lucide-react';
import Link from 'next/link';

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function LimitModal({ isOpen, onClose, message }: LimitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="relative p-6 text-center">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-amber-600" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Usage Limit Reached
          </h3>
          
          <p className="text-gray-600 mb-6">
            {message || "You've hit your free limit for this month. Upgrade to Pro to unlock unlimited AI generation and advanced features."}
          </p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3">
             <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pro Benefits</h4>
             <div className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Unlimited AI Ticket Generation</span>
             </div>
             <div className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Jira Integration & Export</span>
             </div>
             <div className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Priority Support</span>
             </div>
          </div>

          <div className="space-y-3">
            <Link 
              href="/pricing" 
              className="block w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-white" /> Upgrade to Pro
            </Link>
            
            <button 
              onClick={onClose}
              className="block w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Maybe later
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-3 text-xs text-center text-gray-400 border-t border-gray-100">
          Secure payment via Lemon Squeezy
        </div>
      </div>
    </div>
  );
}
