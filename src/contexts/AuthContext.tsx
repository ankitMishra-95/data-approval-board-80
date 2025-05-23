
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// API base URL
const API_BASE_URL = "https://dpc-backend-ma41.onrender.com";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated on mount
    const token = localStorage.getItem("token");
    
    if (token) {
      fetchUserProfile(token).then(userData => {
        if (userData) {
          setIsAuthenticated(true);
          setUser(userData);
        } else {
          // Token is invalid or expired
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setUser(null);
        }
      });
    }
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
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Create form data for token request
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      const data = await response.json();

      // Check if we got "Not Found" error
      if (!response.ok) {
        if (data?.detail === "Not Found") {
          toast.error("Invalid username or password. Please try again.");
        } else {
          toast.error(`Login failed: ${data?.detail || "Unknown error"}`);
        }
        return false;
      }

      // Check if we have the access token
      if (data?.access_token) {
        // Store the token
        localStorage.setItem("token", data.access_token);
        
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
          localStorage.removeItem("token");
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
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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
