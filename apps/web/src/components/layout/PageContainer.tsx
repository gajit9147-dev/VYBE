import React from "react";

export type PageContainerMaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

export interface PageContainerProps {
  maxWidth?: PageContainerMaxWidth;
  className?: string;
  children: React.ReactNode;
}

const maxWidthMap: Record<PageContainerMaxWidth, string> = {
  sm: "max-w-2xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
  "2xl": "max-w-[1440px]",
  full: "max-w-full"
};

export const PageContainer: React.FC<PageContainerProps> = ({
  maxWidth = "xl",
  className = "",
  children
}) => {
  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${maxWidthMap[maxWidth]} ${className}`}
    >
      {children}
    </div>
  );
};
