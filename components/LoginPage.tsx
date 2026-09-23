import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from './AuthContext';
import { authApi } from './utils/api';
import { Shield, Bus, Eye, EyeOff, Mail, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { notify } from './utils/notify';
import { appEnv } from './utils/env';

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
        // Check console for more specific error
        const errorMsg = 'Invalid username or password. Please check your credentials and try again.';
        setError(errorMsg);
        notify.error('Login Failed', {
          description: errorMsg,
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Login exception:', error);
      const errorMsg = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setError(errorMsg);
      notify.error('Login Failed', {
        description: errorMsg,
        duration: 5000
      });
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
          description: response.message || `If an account exists for ${resetEmail}, you will receive a password reset link shortly.`
        });
        
        setResetEmail('');
        setShowForgotPassword(false);
      } else {
        console.error('Forgot password error:', response);
        notify.error('Failed to send reset link', {
          description: response.error || 'Please try again.',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Forgot password exception:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to send reset link. Please try again.';
      notify.error('Failed to send reset link', {
        description: errorMsg,
        duration: 5000
      });
    } finally {
      setIsSubmittingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="bg-green-600 p-3 rounded-full">
              <Bus className="h-8 w-8 text-white" />
            </div>
            <div className="bg-red-600 p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">RISE</h1>
            <p className="text-sm text-gray-600 mt-1">Road Incidents Support & Emergency</p>
            <p className="text-xs text-gray-500">Republic of Ghana Transport Authority</p>
          </div>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In to RISE</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              
              {/* Forgot Password */}
              <div className="text-center">
                <Dialog open={showForgotPassword} onOpenChange={(open) => {
                  setShowForgotPassword(open);
                  if (!open) {
                    setResetEmail('');
                    setResetEmailError('');
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="text-[#193cb8] text-sm p-0 h-auto">
                      Forgot your password?
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader className="space-y-3 pb-4 border-b">
                      <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-[#193cb8]/10 rounded-lg">
                          <Mail className="h-5 w-5 text-[#193cb8]" />
                        </div>
                        Reset Your Password
                      </DialogTitle>
                      <DialogDescription className="text-base">
                        Enter your email address and we'll send you a link to reset your password.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                      <div className="space-y-2.5">
                        <Label htmlFor="resetEmail" className="flex items-center gap-1.5 text-sm font-semibold">
                          Email Address
                          <span className="text-destructive font-bold">*</span>
                        </Label>
                        <Input
                          id="resetEmail"
                          type="email"
                          value={resetEmail}
                          onChange={(e) => {
                            setResetEmail(e.target.value);
                            if (resetEmailError) {
                              setResetEmailError('');
                            }
                          }}
                          placeholder="your.email@rise.gov.gh"
                          className={`h-11 ${resetEmailError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                          disabled={isSubmittingReset}
                        />
                        {resetEmailError && (
                          <div className="flex items-center gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-md">
                            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                            <p className="text-sm text-destructive font-medium">
                              {resetEmailError}
                            </p>
                          </div>
                        )}
                        {!resetEmailError && (
                          <p className="text-xs text-muted-foreground">
                            We'll send password reset instructions to this email
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowForgotPassword(false)}
                          disabled={isSubmittingReset}
                          className="h-11 px-6 font-semibold"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleForgotPassword}
                          disabled={isSubmittingReset}
                          className="min-w-[140px] h-11 px-6 font-semibold shadow-lg bg-[#193cb8] hover:bg-[#142f9e] text-white"
                        >
                          {isSubmittingReset ? (
                            <>
                              <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Reset Link
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </form>
          </CardContent>
        </Card>

        {appEnv.isDev && (
        <Card className="bg-[#193cb8]/10 border-[#193cb8]/20">
          <CardHeader>
            <CardTitle className="text-sm">Demo Accounts - Click to Auto-Fill</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-[#193cb8] mb-3 p-2 bg-[#193cb8]/20 rounded">
              <strong>Password for all accounts:</strong> password
            </div>
            {demoCredentials.map((cred, index) => (
              <div 
                key={index} 
                className="bg-white p-3 rounded border text-xs cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleDemoLogin(cred.username)}
              >
                <div className="font-medium text-[#193cb8]">{cred.role}</div>
                <div className="text-gray-600">Username: {cred.username}</div>
                <div className="text-gray-500 text-xs">{cred.email}</div>
                <div className="text-green-600 text-xs mt-1">Click to auto-fill</div>
              </div>
            ))}
          </CardContent>
        </Card>
        )}

        {/* System Info */}
        <div className="text-center text-xs text-gray-500">
          <p>RISE Transport Management System v2.0</p>
          <p>Secure • Reliable • Efficient</p>
        </div>
      </div>
    </div>
  );
}