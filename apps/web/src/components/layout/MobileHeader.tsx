import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { VYBELogo } from "@/components/ui/VYBELogo";
import { GlassIconButton } from "@/components/ui/GlassIconButton";

export interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  action?: React.ReactNode;
  showLogo?: boolean;
  className?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
  onBack,
  action,
  showLogo = true,
  className = ""
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className={`lg:hidden sticky top-0 z-30 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl pt-[env(safe-area-inset-top,0rem)] ${className}`}
    >
      <div className="h-14 px-4 flex items-center justify-between gap-3 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5 min-w-0">
          {showBack && (
            <GlassIconButton
              aria-label="Go back"
              icon={<ArrowLeft className="w-4 h-4" />}
              size="sm"
              variant="ghost"
              onClick={handleBack}
            />
          )}

          {showLogo && !title && (
            <VYBELogo size="sm" variant="full" />
          )}

          {title && (
            <h1 className="text-base font-bold text-white truncate tracking-tight">
              {title}
            </h1>
          )}
        </div>

        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
      </div>
    </header>
  );
};
