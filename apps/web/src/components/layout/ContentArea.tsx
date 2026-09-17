import React from "react";

export interface ContentAreaProps {
  className?: string;
  children: React.ReactNode;
}

export const ContentArea: React.FC<ContentAreaProps> = ({
  className = "",
  children
}) => {
  return (
    <main
      className={`flex-1 w-full min-w-0 pb-24 lg:pb-8 pt-2 sm:pt-4 ${className}`}
    >
      {children}
    </main>
  );
};
