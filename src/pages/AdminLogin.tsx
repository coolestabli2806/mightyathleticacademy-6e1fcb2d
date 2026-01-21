import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Lock, LogIn, KeyRound, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const ADMIN_EMAIL = "mightyathleticacademy@gmail.com";

    const initializeAuth = async () => {
      // Sign out any existing session when accessing admin login
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check if the current user is already the admin
        if (session.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          navigate("/admin/dashboard");
          return;
        }
        // If logged in as a non-admin (parent), sign them out
        await supabase.auth.signOut();
      }
      setIsInitializing(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Only redirect if it's the admin email
        if (session.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          navigate("/admin/dashboard");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = credentials.email.toLowerCase().trim();
    
    // Only allow admin email to log in
    if (normalizedEmail !== ADMIN_EMAIL_CHECK.toLowerCase()) {
      toast({
        title: "Access Denied",
        description: "Only admin accounts can access this portal. Please use the Parent Login.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: credentials.password,
    });

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You've been logged in successfully.",
      });
      navigate("/admin/dashboard");
    }
    setIsLoading(false);
  };

  const ADMIN_EMAIL_CHECK = "mightyathleticacademy@gmail.com";

  if (isInitializing) {
    return (
      <Layout showFooter={false}>
        <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-secondary">
          <div className="text-muted-foreground">Loading...</div>
        </section>
      </Layout>
    );
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (resetEmail.toLowerCase() !== ADMIN_EMAIL_CHECK.toLowerCase()) {
      toast({
        title: "Incorrect Email ID",
        description: "The email entered is not a valid admin email.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset Link Sent",
        description: "Check your email for the password reset link.",
      });
      setShowForgotPassword(false);
      setResetEmail("");
    }
    setIsLoading(false);
  };

  return (
    <Layout showFooter={false}>
      <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-secondary">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto border-none shadow-card">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-4 shadow-glow">
                <Lock className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-heading">
                {showForgotPassword ? "Reset Password" : "Admin Access"}
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-2">
                {showForgotPassword 
                  ? "Enter your admin email to receive a password reset link"
                  : "Sign in to manage your academy"
                }
              </p>
            </CardHeader>
            <CardContent>
              {showForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Admin Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="admin@elitesoccer.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Sending..."
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 mr-2" />
                        Send Reset Link
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail("");
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="admin@elitesoccer.com"
                      value={credentials.email}
                      onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Signing in..."
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-muted-foreground"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot Password?
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
