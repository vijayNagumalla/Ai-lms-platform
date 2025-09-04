import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [registrationCode, setRegistrationCode] = useState(''); 
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Signup Failed", description: "Passwords do not match." });
      return;
    }
    const userData = { name, email, password, role };
    if (role === 'super-admin') {
      userData.registrationCode = registrationCode;
    }
    const user = signup(userData);
    if (user) {
      switch (user.role) {
        case 'super-admin':
          navigate('/dashboard/super-admin');
          break;
        case 'college-admin':
          navigate('/dashboard/college-admin');
          break;
        case 'faculty':
          navigate('/dashboard/faculty');
          break;
        case 'student':
          navigate('/dashboard/student');
          break;
        default:
          navigate('/dashboard');
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-12"
    >
      <Card className="w-full max-w-md shadow-2xl glassmorphic">
        <CardHeader className="space-y-1 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1}} transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}>
            <UserPlus className="mx-auto h-12 w-12 text-primary" />
          </motion.div>
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
            Create an Account
          </CardTitle>
          <CardDescription>Join EduHorizon LMS today!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-background/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="bg-background/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="bg-background/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">I am a...</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal bg-background/70">
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem onSelect={() => setRole('student')}>Student</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setRole('faculty')}>Faculty</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setRole('college-admin')}>College Admin</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setRole('super-admin')}>Super Admin</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {role === 'super-admin' && (
              <div className="space-y-2">
                <Label htmlFor="registrationCode">Registration Code</Label>
                <Input
                  id="registrationCode"
                  type="password"
                  placeholder="Enter super admin registration code"
                  value={registrationCode}
                  onChange={(e) => setRegistrationCode(e.target.value)}
                  required
                  className="bg-background/70"
                />
                <p className="text-xs text-muted-foreground">
                  Super admin registration requires a special code. Contact system administrator for the code.
                </p>
              </div>
            )}
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground shadow-lg transform hover:scale-105 transition-transform duration-300">
              Sign Up
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default SignupPage;
