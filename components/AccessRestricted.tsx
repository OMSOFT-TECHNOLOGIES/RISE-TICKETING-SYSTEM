import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Shield, Lock } from 'lucide-react';

interface AccessRestrictedProps {
  title?: string;
  message?: string;
  suggestion?: string;
}

export function AccessRestricted({ 
  title = "Access Restricted", 
  message = "You don't have permission to access this feature.",
  suggestion = "Contact your system administrator if you need access to this feature."
}: AccessRestrictedProps) {
  return (
    <div className="p-6 max-w-md mx-auto mt-12">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-orange-800">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-orange-700">{message}</p>
          <p className="text-sm text-orange-600">{suggestion}</p>
          <div className="flex items-center justify-center space-x-2 text-xs text-orange-500">
            <Shield className="h-4 w-4" />
            <span>RISE Security Policy</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}