import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Route, Mail, Lock, Eye, EyeOff, AlertCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const success = await login(data.email, data.password);
      if (success) {
        navigate('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-bg min-h-screen flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#714B67]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#017E84]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#714B67]/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Login Card */}
        <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 border border-white/20 overflow-hidden">
          {/* Header / Branding */}
          <div className="px-8 pt-10 pb-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#714B67] to-[#5A3C52] shadow-lg shadow-[#714B67]/30 mb-5"
            >
              <Route className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-2xl font-bold text-foreground tracking-tight"
            >
              TransitOps
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-sm text-muted-foreground/80 mt-1"
            >
              Fleet Management Platform
            </motion.p>
          </div>

          {/* Error Alerts */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="px-8"
            >
              {error.type === 'invalid' && (
                <Alert className="border-red-200 bg-red-50 text-red-800 mb-4">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 text-sm ml-2">
                    {error.message || 'Invalid email or password. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}
              {error.type === 'locked' && (
                <Alert className="border-amber-200 bg-amber-50 text-amber-800 mb-4">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 text-sm ml-2">
                    {error.message || 'Account locked. Please contact your administrator.'}
                  </AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-8 pb-8 space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@transitops.com"
                  className={`pl-10 h-11 bg-muted/50 border-border focus:border-[#714B67] focus:ring-[#714B67]/20 transition-colors ${
                    errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''
                  }`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 h-11 bg-muted/50 border-border focus:border-[#714B67] focus:ring-[#714B67]/20 transition-colors ${
                    errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''
                  }`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 3,
                      message: 'Password must be at least 3 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  onCheckedChange={(checked) => setValue('rememberMe', checked)}
                  className="border-border data-[state=checked]:bg-[#714B67] data-[state=checked]:border-[#714B67]"
                />
                <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">
                  Remember me
                </Label>
              </div>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-sm text-[#714B67] hover:text-[#5A3C52] font-medium transition-colors hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-[#714B67] to-[#5A3C52] hover:from-[#5A3C52] hover:to-[#4A2F44] text-white font-medium rounded-lg shadow-lg shadow-[#714B67]/25 transition-all duration-200 hover:shadow-xl hover:shadow-[#714B67]/30 disabled:opacity-60"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="px-8 py-4 bg-muted/50 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground/60">
              Secured by TransitOps &middot; v2.0
            </p>
          </div>
        </div>

        {/* Bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-sm text-white/50 mt-6"
        >
          &copy; {new Date().getFullYear()} TransitOps. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
}