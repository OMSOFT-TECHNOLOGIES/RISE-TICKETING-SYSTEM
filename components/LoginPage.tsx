import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RisePreloader, RiseStatusAlert } from './shared/feedback';
import { useAuth } from './AuthContext';
import { authApi } from './utils/api';
import {
  Eye,
  EyeOff,
  Mail,
  AlertCircle,
  Loader2,
  Lock,
  User,
  ArrowRight,
  Bus,
  Activity,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { notify } from './utils/notify';
import { appEnv } from './utils/env';
import { RiseLogo } from './layout/RiseLogo';

/** Served from `/public` — background for the login brand panel */
const LOGIN_HERO_VIDEO_SRC = '/13333965_1080_1920_30fps.mp4';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailError, setResetEmailError] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      if (!success) {
        const errorMsg =
          'Invalid username or password. Please check your credentials and try again.';
        setError(errorMsg);
        notify.error('Login failed', { description: errorMsg, duration: 5000 });
      } else {
        notify.success('Welcome back', {
          description: 'Signing you in to RISE…',
          duration: 3000,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMsg);
      notify.error('Login Failed', { description: errorMsg, duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = appEnv.isDev
    ? [
        { role: 'Super Admin', username: 'superadmin', email: 'superadmin@rise.gov.gh' },
        { role: 'Administrator', username: 'admin', email: 'admin@rise.gov.gh' },
        { role: 'Regional Manager', username: 'rmgr_ashanti', email: 'regional.ashanti@rise.gov.gh' },
        { role: 'District Manager', username: 'dmgr_kumasi', email: 'district.kumasi@rise.gov.gh' },
        { role: 'Operations Admin', username: 'ops_admin', email: 'operations@rise.gov.gh' },
        { role: 'HR Admin', username: 'hr_admin', email: 'hr@rise.gov.gh' },
        { role: 'Incident Reporter', username: 'incident_reporter', email: 'incidents.accra@rise.gov.gh' },
        { role: 'Station Worker', username: 'worker', email: 'worker.station1@rise.gov.gh' },
      ]
    : [];

  const handleDemoLogin = (demoUsername: string) => {
    setUsername(demoUsername);
    setPassword('password');
  };

  const handleForgotPassword = async () => {
    setResetEmailError('');
    if (!resetEmail.trim()) {
      setResetEmailError('Email address is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setResetEmailError('Please enter a valid email address');
      return;
    }
    setIsSubmittingReset(true);
    try {
      const response = await authApi.forgotPassword(resetEmail);
      if (response.success) {
        notify.success('Password reset link sent!', {
          description:
            response.message ||
            `If an account exists for ${resetEmail}, you will receive a password reset link shortly.`,
        });
        setResetEmail('');
        setShowForgotPassword(false);
      } else {
        notify.error('Failed to send reset link', {
          description: response.error || 'Please try again.',
          duration: 5000,
        });
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to send reset link. Please try again.';
      notify.error('Failed to send reset link', { description: errorMsg, duration: 5000 });
    } finally {
      setIsSubmittingReset(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Brand panel — video background + brand overlay */}
      <div className="relative hidden lg:flex lg:w-[44%] xl:w-[42%] text-white overflow-hidden bg-[#0a1020]">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        >
          <source src={LOGIN_HERO_VIDEO_SRC} type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              'linear-gradient(165deg, rgba(10,16,32,0.82) 0%, rgba(15,42,110,0.72) 45%, rgba(12,18,34,0.88) 100%)',
          }}
        />
        <div className="absolute inset-0 rise-auth-grid pointer-events-none opacity-80" aria-hidden />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <RiseLogo variant="onBrand" />

          <div className="space-y-8 max-w-md">
            <div>
              <h1 className="text-3xl xl:text-4xl font-semibold tracking-tight leading-tight">
                National transport operations, unified.
              </h1>
              <p className="mt-4 text-base text-white/75 leading-relaxed">
                Manage fleets, trips, passengers, and incident response on one secure platform
                for Ghana&apos;s transport authority.
              </p>
            </div>

            <ul className="space-y-4">
              {[
                { icon: Bus, label: 'Trip & passenger operations' },
                { icon: Activity, label: 'Real-time incident & safety workflows' },
                { icon: Lock, label: 'Role-based secure access' },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-white/50">
            Republic of Ghana · Transport Management System v2.0
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[var(--rise-surface)] dark:bg-background">
        <div className="w-full max-w-[420px] space-y-8">
          <div className="lg:hidden">
            <RiseLogo variant="dark" className="justify-center" />
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in with your RISE staff credentials to continue.
            </p>
          </div>

          <div className="relative rounded-2xl border bg-card p-6 sm:p-8 shadow-sm shadow-black/5">
            {loading ? (
              <RisePreloader variant="overlay" label="Signing in…" className="rounded-2xl" />
            ) : null}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your.username"
                    className="h-11 pl-9 bg-muted/40 border-border/80"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Dialog
                    open={showForgotPassword}
                    onOpenChange={(open) => {
                      setShowForgotPassword(open);
                      if (!open) {
                        setResetEmail('');
                        setResetEmailError('');
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-primary" />
                          Reset password
                        </DialogTitle>
                        <DialogDescription>
                          We&apos;ll email you a secure link to choose a new password.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="resetEmail">Email address</Label>
                          <Input
                            id="resetEmail"
                            type="email"
                            value={resetEmail}
                            onChange={(e) => {
                              setResetEmail(e.target.value);
                              if (resetEmailError) setResetEmailError('');
                            }}
                            placeholder="your.email@rise.gov.gh"
                            className="h-11"
                            disabled={isSubmittingReset}
                          />
                          {resetEmailError && (
                            <p className="flex items-center gap-1.5 text-sm text-destructive">
                              <AlertCircle className="h-4 w-4 shrink-0" />
                              {resetEmailError}
                            </p>
                          )}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowForgotPassword(false)}
                            disabled={isSubmittingReset}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={() => void handleForgotPassword()}
                            disabled={isSubmittingReset}
                          >
                            {isSubmittingReset ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sending…
                              </>
                            ) : (
                              'Send link'
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 pl-9 pr-10 bg-muted/40 border-border/80"
                    required
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {error ? (
                <RiseStatusAlert type="error" onDismiss={() => setError('')}>
                  {error}
                </RiseStatusAlert>
              ) : null}

              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 ml-2 opacity-80" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {appEnv.isDev && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                Development — demo accounts
              </p>
              <p className="text-xs text-muted-foreground">
                Password for all: <span className="font-mono font-medium">password</span>
              </p>
              <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                {demoCredentials.map((cred) => (
                  <button
                    key={cred.username}
                    type="button"
                    className="text-left rounded-xl border bg-card px-3 py-2.5 text-xs hover:border-primary/40 hover:bg-card/80 transition-colors"
                    onClick={() => handleDemoLogin(cred.username)}
                  >
                    <span className="font-medium text-foreground">{cred.role}</span>
                    <span className="block text-muted-foreground mt-0.5">{cred.username}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground lg:text-left">
            Authorized personnel only · Secure · Reliable · Efficient
          </p>
          <p className="text-center text-sm lg:text-left">
            <a
              href="/report-hazard"
              className="font-medium text-[#193cb8] hover:underline"
            >
              Report a road hazard (public, no login)
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
