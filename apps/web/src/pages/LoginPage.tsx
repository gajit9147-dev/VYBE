import React, { useEffect } from "react";
import { AuthHeader } from "@/features/auth/components/AuthHeader";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const LoginPage: React.FC = () => {
  useEffect(() => {
    document.title = "VYBE — Sign In";
  }, []);

  return (
    <div className="w-full">
      <AuthHeader
        title="Welcome back."
        subtitle="Sign in to continue your VYBE journey."
      />
      <LoginForm />
    </div>
  );
};
