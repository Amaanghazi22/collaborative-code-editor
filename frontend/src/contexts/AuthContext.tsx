import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { SignUpT } from "@/services/apiTypes.ts";
import { signupUser, userLogin } from "@/services/authApi.ts";

import { toast } from "sonner";

interface User {
  id: string;
  isActive: boolean;
  username: string;
  email: string;
  updatedAt: string;
  createdAt: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (payload: SignUpT) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - replace with real API call to your backend
    const response = await userLogin({ email, password });

    if (response.success) {
      toast.success(response.message);
      const loggedinUser = {
        ...response.data.user,
        token: response.data.token,
      };

      setUser(loggedinUser);
      localStorage.setItem("user", JSON.stringify(loggedinUser));
      return response.success;
    }
    const errorMessage =
      response?.errors && response?.errors[0]?.message
        ? response.errors[0]?.message
        : response?.message
        ? response.message
        : "Something went wrong";
    toast.error(errorMessage);
    return false;
  };

  const signup = async (signupdata: SignUpT) => {
    // Mock signup - replace with real API call to your backend
    const response = await signupUser(signupdata);

    if (response.success) {
      toast.success(response.message);
      const loggedinUser = {
        ...response.data.user,
        token: response.data.token,
      };

      setUser(loggedinUser);
      localStorage.setItem("user", JSON.stringify(loggedinUser));
      return response.success;
    }

    const errorMessage =
      response?.errors && response?.errors[0]?.message
        ? response.errors[0]?.message
        : response?.message
        ? response.message
        : "Something went wrong";
    toast.error(errorMessage);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
