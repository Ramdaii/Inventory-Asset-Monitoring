/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { Lock, ShieldCheck, Delete, ArrowRight, UserCheck, KeyRound, AlertCircle } from 'lucide-react';

interface PinLockScreenProps {
  users: UserProfile[];
  onAuthenticated: (user: UserProfile) => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ users, onAuthenticated }) => {
  const [pin, setPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Allow physical keyboard entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitClick(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, users]);

  // Check pin when length reaches 6
  useEffect(() => {
    if (pin.length === 6) {
      verifyPin(pin);
    }
  }, [pin]);

  const verifyPin = (enteredPin: string) => {
    const matchedUser = users.find((u) => u.pin === enteredPin);
    if (matchedUser) {
      onAuthenticated(matchedUser);
    } else {
      setErrorShake(true);
      setErrorMessage('PIN Akses Salah. Silakan coba kembali.');
      setTimeout(() => {
        setPin('');
        setErrorShake(false);
      }, 700);
    }
  };

  const handleDigitClick = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setErrorMessage(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage(null);
  };

  const handleQuickFill = (userPin: string) => {
    setPin(userPin);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-slate-800 selection:text-white">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
        {/* Security Shield Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-white mb-4 shadow-inner">
          <Lock className="w-7 h-7 text-emerald-400" />
        </div>

        <h1 className="text-lg font-bold text-white tracking-tight">GA-Ops Enterprise Access</h1>
        <p className="text-xs text-slate-400 text-center mt-1">
          Masukkan 6-digit PIN akses untuk masuk ke Dashboard Operasional
        </p>

        {/* PIN Digit Dots */}
        <div
          className={`flex items-center justify-center gap-3 my-6 ${
            errorShake ? 'animate-bounce text-rose-500' : ''
          }`}
        >
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-emerald-400 scale-110 shadow-xs shadow-emerald-400/50'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {errorMessage && (
          <div className="text-xs text-rose-400 font-medium mb-3 flex items-center gap-1.5 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* On-Screen Numerical Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitClick(digit)}
              className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-bold text-lg border border-slate-700/60 transition-colors flex items-center justify-center shadow-xs"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 font-medium text-xs border border-slate-800 transition-colors flex items-center justify-center"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigitClick('0')}
            className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-bold text-lg border border-slate-700/60 transition-colors flex items-center justify-center shadow-xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 transition-colors flex items-center justify-center"
            title="Hapus Digit"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* User Account Shortcuts & Hint */}
        <div className="w-full mt-6 pt-5 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showHint ? 'Tutup Daftar Akun & PIN' : 'Buka Daftar Akun & PIN Akses'}</span>
          </button>

          {showHint && (
            <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Akun Terdaftar & Akses PIN:
              </div>
              <div className="space-y-1.5">
                {users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleQuickFill(u.pin)}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer text-slate-300 transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-white group-hover:text-emerald-400">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-slate-500">{u.roleLabel}</div>
                    </div>
                    <div className="flex items-center gap-1 font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-[11px]">
                      PIN: {u.pin}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-[10px] text-slate-500 font-mono">
          E2EE Encrypted Session · Standar Keamanan ISO 27001
        </div>
      </div>
    </div>
  );
};
