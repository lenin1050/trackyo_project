import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, Phone, DollarSign, Palette, Eye, EyeOff } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const AuthPages = ({ showToast }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login, register, forgotPassword } = useAuth();

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    preferredCurrency: 'INR',
    themePreference: 'dark',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      // Login Action
      if (!formData.email || !formData.password) {
        showToast('Please fill all required fields', 'warning');
        setLoading(false);
        return;
      }

      const res = await login(formData.email, formData.password);
      if (res.success) {
        showToast('Logged in successfully! Welcome to Trackyo.', 'success');
      } else {
        showToast(res.message, 'danger');
      }
    } else {
      // Registration Action
      if (!formData.name || !formData.email || !formData.password || !formData.mobile) {
        showToast('Please fill all required fields', 'warning');
        setLoading(false);
        return;
      }

      const res = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.mobile,
        formData.preferredCurrency,
        formData.themePreference
      );

      if (res.success) {
        showToast('Account registered successfully!', 'success');
      } else {
        showToast(res.message, 'danger');
      }
    }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!formData.email) {
      showToast('Please enter your email address first', 'warning');
      return;
    }
    const res = await forgotPassword(formData.email);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'danger');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-themeBg select-none">
      
      {/* Visual background glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-themePrimary/10 filter blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-themeAccent/10 filter blur-3xl animate-pulse delay-700" />

      <GlassCard className="w-full max-w-md relative z-10 p-8 shadow-glass transition-all duration-500">
        
        {/* Brand Banner */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="p-3 rounded-2xl bg-themePrimary text-white shadow-neon-glow flex items-center justify-center mb-3">
            <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-themePrimary to-themeAccent">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-xs text-themeTextMuted mt-1.5 font-bold tracking-wide uppercase">
            {isLogin ? '“Track Smart. Spend Wise. That’s Trackyo.”' : 'Start automated AI expense tracking'}
          </p>
        </div>

        {/* Auth Forms */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          
          {/* Registration fields */}
          {!isLogin && (
            <>
              {/* Full Name */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Full Name*</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-themeTextMuted" />
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Rahul Sharma"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="theme-input pl-10 w-full text-sm"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Mobile Number*</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 w-4 h-4 text-themeTextMuted" />
                  <input
                    type="tel"
                    name="mobile"
                    required
                    placeholder="9876543210"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="theme-input pl-10 w-full text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Email Address*</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-themeTextMuted" />
              <input
                type="email"
                name="email"
                required
                placeholder="rahul@trackyo.in"
                value={formData.email}
                onChange={handleInputChange}
                className="theme-input pl-10 w-full text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Password*</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-themeTextMuted" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                placeholder="••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="theme-input pl-10 pr-10 w-full text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-themeTextMuted hover:text-themeText transition-all"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Currency & Theme Selection Grid */}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Preferred Currency</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-themeTextMuted" />
                  <select
                    name="preferredCurrency"
                    value={formData.preferredCurrency}
                    onChange={handleInputChange}
                    className="theme-input pl-10 w-full text-xs"
                  >
                    <option value="INR" className="bg-slate-900 text-white">INR (Rs.)</option>
                    <option value="USD" className="bg-slate-900 text-white">USD ($)</option>
                    <option value="EUR" className="bg-slate-900 text-white">EUR (€)</option>
                    <option value="GBP" className="bg-slate-900 text-white">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-themeTextMuted uppercase mb-1.5 pl-1">Theme Style</label>
                <div className="relative">
                  <Palette className="absolute left-3 top-3.5 w-4 h-4 text-themeTextMuted" />
                  <select
                    name="themePreference"
                    value={formData.themePreference}
                    onChange={handleInputChange}
                    className="theme-input pl-10 w-full text-xs"
                  >
                    <option value="dark" className="bg-slate-900 text-white">Dark Mode</option>
                    <option value="light" className="bg-slate-900 text-white">Light Mode</option>
                    <option value="neon" className="bg-slate-900 text-white">Cyber Neon</option>
                    <option value="minimal" className="bg-slate-900 text-white">Mono Minimal</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Forgot Password Link */}
          {isLogin && (
            <div className="flex justify-end pr-1 text-right">
              <button
                type="button"
                onClick={handleForgot}
                className="text-[11px] font-black text-themePrimary hover:text-themePrimaryHover transition-all hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-themePrimary text-white shadow-neon-glow hover:bg-themePrimaryHover font-bold text-sm tracking-wide transition-all flex items-center justify-center space-x-1.5"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              <span>{isLogin ? 'Sign In Securely' : 'Register Account'}</span>
            )}
          </button>

          {/* Toggle Panel Button */}
          <div className="text-center pt-4 border-t border-themeBorder text-xs text-themeTextMuted">
            <span>{isLogin ? "Don't have an account? " : 'Already registered with us? '}</span>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-black text-themePrimary hover:text-themePrimaryHover transition-all hover:underline"
            >
              {isLogin ? 'Create Account' : 'Sign In'}
            </button>
          </div>

        </form>

      </GlassCard>
    </div>
  );
};

export default AuthPages;
