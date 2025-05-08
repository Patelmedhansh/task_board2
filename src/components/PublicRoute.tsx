import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ReactNode, useEffect } from "react";
import { toast } from "react-hot-toast";

export const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

//   useEffect(() => {
//     if (!loading && user) {
//       toast("You're already logged in.", { icon: "🔒" });
//     }
//   }, [loading, user]);

  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};
