import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// CHANGED: Import from new custom AuthContext
import { useAuth } from '@/contexts/AuthContext'; 

const LoginPage = () => {
  const navigate = useNavigate();
  // CHANGED: Destructure 'login' and 'register' (replacing signIn/signUp)
  const { user, login, register } = useAuth(); 
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); // State for showing backend errors
  
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    // CHANGED: Call new login method
    const { error } = await login(signInEmail, signInPassword);
    
    setIsLoading(false);
    if (error) {
      setErrorMsg(error);
    } else {
      navigate('/');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    // CHANGED: Call new register method
    const { error: registerError } = await register(signUpEmail, signUpPassword);
    
    if (registerError) {
      setIsLoading(false);
      setErrorMsg(registerError);
    } else {
      // SUCCESS: Attempt to log in immediately after registration
      const { error: loginError } = await login(signUpEmail, signUpPassword);
      setIsLoading(false);
      
      if (!loginError) {
        navigate('/');
      } else {
        // If auto-login fails, inform user to try logging in manually
        setErrorMsg('Registration successful, but automatic login failed. Please sign in.');
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | DealForge</title>
        <meta name="description" content="Sign in to DealForge to track your favorite Steam games." />
      </Helmet>

      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to DealForge</h1>
            <p className="text-gray-400">Track prices and never miss a deal</p>
          </div>

          <div className="bg-[#2a2a2f] rounded-lg border border-[#3a3a3f] p-6">
            {/* Display Errors */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm text-center">
                {errorMsg}
              </div>
            )}

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#1a1a1f]">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        className="pl-10 bg-[#1a1a1f] border-[#3a3a3f]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="pl-10 bg-[#1a1a1f] border-[#3a3a3f]"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        className="pl-10 bg-[#1a1a1f] border-[#3a3a3f]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="pl-10 bg-[#1a1a1f] border-[#3a3a3f]"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        className="pl-10 bg-[#1a1a1f] border-[#3a3a3f]"
                        required
                        minLength={6}
                      />
                    </div>
                    {/* The original code had a separate check here, but the combined error message is better */}
                    {/* {signUpPassword !== signUpConfirmPassword && signUpConfirmPassword && (
                      <p className="text-red-400 text-sm">Passwords do not match</p>
                    )} */}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={isLoading || signUpPassword !== signUpConfirmPassword}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;