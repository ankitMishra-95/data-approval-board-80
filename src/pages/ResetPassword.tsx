import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  newPassword: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link. Please request a new password reset.");
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    setIsLoading(true);
    
    try {
      await resetPassword(token, values.newPassword);
      setIsSuccess(true);
    } catch (error) {
      // Error handling is done in the AuthContext
      console.error("Reset password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-4">
          <Card className="border-green-100 shadow-lg">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-center font-bold text-green-900">
                Password Reset Successfully
              </CardTitle>
              <CardDescription className="text-center text-gray-500">
                Your password has been updated. You can now sign in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-4">
        <Card className="border-blue-100 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center font-bold text-blue-900">
              Reset Password
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
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
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            className="pl-10 pr-10"
                            {...field}
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 text-gray-400"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                              {showConfirmPassword ? "Hide password" : "Show password"}
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
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardContent className="pt-0">
            <Link to="/">
              <Button
                variant="ghost"
                className="w-full text-blue-600 hover:bg-blue-50"
                disabled={isLoading}
              >
                Back to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword; 