import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { ClientPassLogo } from '@/components/ClientPassLogo';
import { supabase } from '@/integrations/supabase/client';

interface SignUpFormProps {
  onToggleMode: () => void;
}

export const SignUpForm = ({ onToggleMode }: SignUpFormProps) => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const inviteToken = searchParams.get('invite_token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!inviteToken) {
        setMessage('No invitation token provided. Please use the link from your invitation email.');
        return;
      }
      const { data, error } = await supabase
        .from('docs_invites')
        .select('id, invitee_email')
        .eq('token', inviteToken)
        .eq('status', 'pending')
        .single();

      if (error || !data) {
        setMessage('This invitation is invalid or has expired.');
        setIsValidToken(false);
      } else {
        setEmail(data.invitee_email);
        setIsValidToken(true);
      }
    };
    verifyToken();
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidToken) return;

    setLoading(true);
    setMessage('');

    const { error } = await useAuth().signUp(email, password, fullName, 'member');

    if (error) {
      setMessage(`Sign up failed: ${error.message}`);
    } else {
      // Mark token as accepted
      await supabase.from('docs_invites').update({ status: 'accepted' }).eq('token', inviteToken);
      setMessage('Account created! Please check your email for verification.');
    }
    setLoading(false);
  };

  if (!isValidToken && !message) {
    return <p>Verifying invitation...</p>;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <ClientPassLogo size="lg" />
        </div>
        <CardTitle>Create Your Account</CardTitle>
        <CardDescription>
          Complete your sign up to access the documentation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isValidToken ? (
          <p className="text-center text-destructive">{message}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
            {message && <p className="mt-4 text-sm text-center text-muted-foreground">{message}</p>}
          </form>
        )}
        <div className="text-center pt-6">
          <button type="button" onClick={onToggleMode} className="text-sm text-primary hover:underline">
            Already have an account? Sign in
          </button>
        </div>
      </CardContent>
    </Card>
  );
};