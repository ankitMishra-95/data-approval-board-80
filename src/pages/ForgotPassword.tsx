import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { User, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
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
  email: z.string().email({ message: "Please enter a valid email address" }),
});

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      await forgotPassword(values.email);
      setIsSubmitted(true);
    } catch (error) {
      // Error handling is done in the AuthContext
      console.error("Forgot password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-4">
          <Card className="border-green-100 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center font-bold text-green-900">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-center text-gray-500">
                We've sent a password reset link to your email address.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                If you don't see the email, check your spam folder.
              </p>
              <Link to="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
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
              Forgot Password
            </CardTitle>
            <CardDescription className="text-center text-gray-500">
              Enter your email address to receive a password reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="email"
                            placeholder="you@example.com"
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
                
                <Button
                  type="submit"
                  variant="default"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
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
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword; 