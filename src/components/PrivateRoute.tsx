import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ReactNode, useEffect } from "react";
import { toast } from "react-hot-toast";

export const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Please log in to access the dashboard.");
    }
  }, [loading, user]);

  if (loading) return null;
  return user ? children : <Navigate to="/" replace />;
};
