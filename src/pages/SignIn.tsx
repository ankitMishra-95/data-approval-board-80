import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Form schema for validation - now accepts both username and email
const formSchema = z.object({
  username: z.string().min(1, { message: "Username or email is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const SignIn = () => {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSignIn = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      // Use the context's login function - now passing username field directly
      await login(values.username, values.password);
    } catch (error) {
      toast.error("An unexpected error occurred.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show nothing while checking authentication
  if (authLoading) {
    return null;
  }

  // If authenticated, don't render the sign-in form
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-4">
        <Card className="border-blue-100 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center font-bold text-blue-900">
              Sign In
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username or Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="username or you@example.com"
                            className="pl-10"
                            {...field}
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="pl-10 pr-10"
                            {...field}
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 text-gray-400"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                              {showPassword ? "Hide password" : "Show password"}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  variant="default"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <Link to="/forgot-password" className="w-full">
              <Button
                variant="ghost"
                className="w-full text-blue-600 hover:bg-blue-50"
                disabled={isLoading}
              >
                Forgot Password?
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
