import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Cookies from 'js-cookie';
import { forgotPassword, resetPassword, changePassword } from "@/lib/api/auth";

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

// API base URL
const API_BASE_URL = "https://dpc-api-g9hkfhaggbesd0fj.southeastasia-01.azurewebsites.net";  // Direct backend URL

// Cookie configuration
const AUTH_COOKIE_NAME = 'auth_token';
const COOKIE_OPTIONS = {
  expires: 7, // Cookie expires in 7 days
  secure: true, // Only transmit over HTTPS
  sameSite: 'strict' as const // Protect against CSRF
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Check authentication status on mount and cookie changes
  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get(AUTH_COOKIE_NAME);
      
      if (token) {
        try {
          const userData = await fetchUserProfile(token);
          if (userData) {
            setIsAuthenticated(true);
            setUser(userData);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error checking authentication:", error);
        }
        
        // If we get here, the token is invalid
        Cookies.remove(AUTH_COOKIE_NAME);
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const fetchUserProfile = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      // Create form data for token request
      const formData = new URLSearchParams();
      formData.append('username', usernameOrEmail);
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          if (data?.detail === "Not Found") {
            toast.error("Invalid username or password. Please try again.");
          } else {
            toast.error(`Login failed: ${data?.detail || "Unknown error"}`);
          }
        } catch {
          toast.error(`Login failed: ${text || "Unknown error"}`);
        }
        return false;
      }

      const data = await response.json();

      // Check if we have the access token
      if (data?.access_token) {
        // Store the token in a secure cookie
        Cookies.set(AUTH_COOKIE_NAME, data.access_token, COOKIE_OPTIONS);
        
        // Fetch user profile
        const userData = await fetchUserProfile(data.access_token);
        
        if (userData) {
          setIsAuthenticated(true);
          setUser(userData);
          toast.success("Signed in successfully!");
          navigate("/dashboard");
          return true;
        } else {
          toast.error("Could not retrieve user profile. Please try again.");
          Cookies.remove(AUTH_COOKIE_NAME);
          return false;
        }
      } else {
        toast.error("Authentication failed. Invalid response from server.");
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login. Please try again.");
      return false;
    }
  };

  const logout = () => {
    Cookies.remove(AUTH_COOKIE_NAME);
    setIsAuthenticated(false);
    setUser(null);
    navigate("/");
    toast.success("Logged out successfully");
  };

  const handleForgotPassword = async (email: string): Promise<void> => {
    try {
      await forgotPassword({ email });
      toast.success("Password reset email sent. Please check your inbox.");
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Failed to send reset email. Please try again.");
      throw error;
    }
  };

  const handleResetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      await resetPassword({ token, newPassword });
      toast.success("Password reset successfully!");
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Failed to reset password. The link may have expired. Please request a new one.");
      throw error;
    }
  };

  const handleChangePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    try {
      await changePassword({ oldPassword, newPassword });
      toast.success("Password changed successfully!");
    } catch (error) {
      console.error("Change password error:", error);
      toast.error("Failed to change password. Please check your current password and try again.");
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      user, 
      login, 
      logout,
      forgotPassword: handleForgotPassword,
      resetPassword: handleResetPassword,
      changePassword: handleChangePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
