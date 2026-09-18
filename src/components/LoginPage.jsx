import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  FileText, 
  Database, 
  Sparkles, 
  ArrowRight, 
  Phone, 
  MapPin
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import { db } from '../services/db';

export function LoginPage({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const user = await db.login(identifier, password);
      if (user) {
        if (onLoginSuccess) {
          onLoginSuccess(user);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials. Please verify your login details.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center relative overflow-hidden font-sans select-none">
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(245,158,11,0.08)_0%,_transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(10,34,64,0.9)_0%,_transparent_60%)] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-navy rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-gold rounded-full blur-3xl opacity-15 pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80">
          
          {/* =========================================================================
              LEFT COLUMN: Enterprise Branding & Trust Credentials (Deep Navy Theme)
             ========================================================================= */}
          <div className="lg:col-span-5 bg-gradient-to-br from-brand-navy-dark via-brand-navy to-brand-navy-subtle text-white p-5 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
            
            {/* Subtle overlay grid effect */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-brand-gold/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-8">
              {/* Brand Emblem & Header */}
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-xs font-bold tracking-wider uppercase backdrop-blur-md">
                  <ShieldCheck className="w-4 h-4 text-brand-gold" />
                  <span>Hosur Dispatch Hub · Est. 2018</span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-white p-3 rounded-2xl shadow-xl border border-white/20 shrink-0">
                    <img 
                      src={logoImg} 
                      alt="Sri Ram Transport Logo" 
                      className="h-14 w-auto object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-white">
                      SRI RAM TRANSPORT
                    </h1>
                    <p className="text-xs font-medium text-slate-300 tracking-wide">
                      Transport & Logistics Management System
                    </p>
                  </div>
                </div>

                {/* Brand Slogan */}
                <div className="flex items-center space-x-2 text-xs font-extrabold tracking-widest text-brand-gold uppercase pt-1">
                  <span>TRUST</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-gold"></span>
                  <span>TRANSPORT</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-gold"></span>
                  <span>TOGETHER</span>
                </div>
              </div>

              {/* Core System Highlights */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="p-2 rounded-lg bg-brand-gold/20 text-brand-gold shrink-0 mt-0.5">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Digital Lorry Receipts (LR)</h4>
                    <p className="text-xs text-slate-300 font-light leading-relaxed">
                      Instant LR creation with automated dual-money freight and profit calculation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Hard-Gated POD Verification</h4>
                    <p className="text-xs text-slate-300 font-light leading-relaxed">
                      Trips cannot be marked completed without a physical signed LR / POD copy.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Consolidated GST Tax Invoices</h4>
                    <p className="text-xs text-slate-300 font-light leading-relaxed">
                      SAC 9965 reverse-charge invoicing with 10-column audited itemization.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Operating Credentials Footer */}
            <div className="relative z-10 pt-8 border-t border-white/15 space-y-3 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-emerald-300">Dispatch Operations Online</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">GSTIN: 33GUPS2382N1ZF</span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                <span>Bathalapalli Market Road, Hosur - 635109</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: Authentication Form & Quick Demo Access
             ========================================================================= */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-8 lg:p-12 flex flex-col justify-between">
            <div className="max-w-md mx-auto w-full space-y-6">
              
              {/* Form Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider uppercase text-brand-gold-dark bg-brand-gold/10 px-2.5 py-1 rounded-md">
                    Secure Portal Login
                  </span>
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    <Database className="w-3.5 h-3.5 text-slate-600" />
                    <span>{db.isConfigured ? 'Supabase Connected' : 'Local Storage Ready'}</span>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight pt-2">
                  Sign in to Portal
                </h2>
                <p className="text-sm text-slate-500">
                  Enter your dispatch credentials to manage lorry bookings and billing.
                </p>
              </div>

              {/* Error Alert Banner */}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-800 animate-shake">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <p className="font-bold text-rose-900">Authentication Failed</p>
                    <p className="mt-0.5 text-rose-700">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Main Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username / Email Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Username or Official Email
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      id="login-identifier-input"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Mail "
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/15 rounded-xl text-sm font-medium text-slate-900 transition-colors placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login-password-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/15 rounded-xl text-sm font-medium text-slate-900 transition-colors placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-navy focus:ring-brand-navy/20 border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-600">Keep me signed in on this dispatch terminal</span>
                  </label>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  id="login-submit-button"
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-navy to-brand-navy-light hover:from-brand-navy-dark hover:to-brand-navy text-white font-bold text-sm tracking-wide shadow-lg shadow-brand-navy/20 hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dispatch Portal</span>
                      <ArrowRight className="w-4 h-4 text-brand-gold" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Security Note */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-4 h-4 text-brand-gold-dark shrink-0" />
              <span>Protected by 10-round Blowfish Bcrypt Encryption & strict role-based authorization.</span>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}

export default LoginPage;
