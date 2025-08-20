import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from './AuthContext';
import { Shield, Bus, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      if (!success) {
        setError('Invalid username or password. Please check your credentials and try again.');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'Super Admin', username: 'superadmin', email: 'superadmin@rise.gov.gh' },
    { role: 'Administrator', username: 'admin', email: 'admin@rise.gov.gh' },
    { role: 'Regional Manager', username: 'rmgr_ashanti', email: 'regional.ashanti@rise.gov.gh' },
    { role: 'District Manager', username: 'dmgr_kumasi', email: 'district.kumasi@rise.gov.gh' },
    { role: 'Operations Admin', username: 'ops_admin', email: 'operations@rise.gov.gh' },
    { role: 'HR Admin', username: 'hr_admin', email: 'hr@rise.gov.gh' },
    { role: 'Incident Reporter', username: 'incident_reporter', email: 'incidents.accra@rise.gov.gh' },
    { role: 'Station Worker', username: 'worker', email: 'worker.station1@rise.gov.gh' }
  ];

  const handleDemoLogin = (demoUsername: string) => {
    setUsername(demoUsername);
    setPassword('password');
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
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm">Demo Accounts - Click to Auto-Fill</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-blue-700 mb-3 p-2 bg-blue-100 rounded">
              <strong>Password for all accounts:</strong> password
            </div>
            {demoCredentials.map((cred, index) => (
              <div 
                key={index} 
                className="bg-white p-3 rounded border text-xs cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleDemoLogin(cred.username)}
              >
                <div className="font-medium text-blue-900">{cred.role}</div>
                <div className="text-gray-600">Username: {cred.username}</div>
                <div className="text-gray-500 text-xs">{cred.email}</div>
                <div className="text-green-600 text-xs mt-1">Click to auto-fill</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Login Buttons */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-sm text-green-800">Quick Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('admin')}
                className="text-xs"
              >
                Login as Admin
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('incident_reporter')}
                className="text-xs"
              >
                Incident Reporter
              </Button>
            </div>
            <div className="text-xs text-green-700 mt-2 p-2 bg-green-100 rounded">
              <strong>✅ Test Access:</strong> Incident Reporter has full access to all Safety & Incidents pages including Accident Analysis.
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <div className="text-center text-xs text-gray-500">
          <p>RISE Transport Management System v2.0</p>
          <p>Secure • Reliable • Efficient</p>
        </div>
      </div>
    </div>
  );
}