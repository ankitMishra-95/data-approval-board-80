
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Default credentials
const DEFAULT_EMAIL = "admin@example.com";
const DEFAULT_PASSWORD = "password123";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated on mount
    const auth = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(auth);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Check if credentials match our default ones
    if (email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
      localStorage.setItem("isAuthenticated", "true");
      setIsAuthenticated(true);
      toast.success("Signed in successfully!");
      navigate("/dashboard");
      return true;
    } else {
      toast.error("Invalid credentials. Please try again.");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
