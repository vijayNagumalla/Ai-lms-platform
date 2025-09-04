import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Mail, CheckCircle, XCircle, AlertCircle, Settings, TestTube } from 'lucide-react';
import apiService from '@/services/api';

const EmailConfigStatus = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    checkEmailConfig();
  }, []);

  const checkEmailConfig = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/email/config');
      if (response.success) {
        setConfig(response.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to check email configuration',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error checking email config:', error);
      toast({
        title: 'Error',
        description: 'Failed to check email configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testEmailService = async () => {
    if (!testEmail) {
      toast({
        title: 'Error',
        description: 'Please enter a test email address',
        variant: 'destructive'
      });
      return;
    }

    try {
      setTesting(true);
      const response = await apiService.post('/email/test', { testEmail });
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Test email sent successfully!',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to send test email',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error testing email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Configuration Status
        </CardTitle>
        <CardDescription>
          Check and test email service configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Email Service Status</span>
            <Badge variant={config?.isConfigured ? 'default' : 'destructive'}>
              {config?.isConfigured ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configured
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Configured
                </>
              )}
            </Badge>
          </div>

          {/* Configuration Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">SMTP Host:</span>
              <p className="font-medium">{config?.smtpHost}</p>
            </div>
            <div>
              <span className="text-muted-foreground">SMTP Port:</span>
              <p className="font-medium">{config?.smtpPort}</p>
            </div>
            <div>
              <span className="text-muted-foreground">SMTP User:</span>
              <p className="font-medium">{config?.smtpUser}</p>
            </div>
            <div>
              <span className="text-muted-foreground">SMTP Password:</span>
              <p className="font-medium">{config?.smtpPass}</p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">From Email:</span>
              <p className="font-medium">{config?.smtpFrom}</p>
            </div>
          </div>

          {/* Warning if not configured */}
          {!config?.isConfigured && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Email Service Not Configured</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    To enable email notifications, please set the following environment variables:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
                    <li><code>SMTP_USER</code> - Your email address</li>
                    <li><code>SMTP_PASS</code> - Your email password or app password</li>
                    <li><code>SMTP_HOST</code> - SMTP server (default: smtp.gmail.com)</li>
                    <li><code>SMTP_PORT</code> - SMTP port (default: 587)</li>
                    <li><code>SMTP_FROM</code> - From email address (optional)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Email Section */}
        {config?.isConfigured && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              <h4 className="text-sm font-medium">Test Email Service</h4>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="testEmail">Test Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="Enter email address to test"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <Button 
                  onClick={testEmailService} 
                  disabled={testing || !testEmail}
                  size="sm"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Test'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button onClick={checkEmailConfig} variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailConfigStatus; 