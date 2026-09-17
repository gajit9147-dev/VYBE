import React from "react";
import { AuthHeader } from "@/features/auth/components/AuthHeader";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const RegisterPage: React.FC = () => {
  return (
    <div className="w-full">
      <AuthHeader
        title="Create your VYBE account."
        subtitle="Start discovering real people and meaningful connections."
      />
      <RegisterForm />
    </div>
  );
};
