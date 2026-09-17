import React from "react";

export interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  className = ""
}) => {
  return (
    <div className={`space-y-1.5 text-center mb-6 ${className}`}>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
        {title}
      </h1>
      {subtitle && (
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
