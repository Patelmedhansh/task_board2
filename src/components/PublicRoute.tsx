import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ReactNode } from "react";

export const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};
