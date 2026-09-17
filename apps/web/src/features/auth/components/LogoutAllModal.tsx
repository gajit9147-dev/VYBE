import React from "react";
import { ShieldAlert } from "lucide-react";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassButton } from "@/components/ui/GlassButton";

export interface LogoutAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export const LogoutAllModal: React.FC<LogoutAllModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="Sign out of all devices?"
      description="Invalidate all active sessions across devices"
      size="sm"
    >
      <div className="flex flex-col items-center text-center space-y-4 pt-2">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          This will immediately invalidate all active sessions for your account on every browser, phone, and computer. You will need to sign in again everywhere.
        </p>

        <div className="w-full pt-3 space-y-2">
          <GlassButton
            variant="primary"
            size="md"
            fullWidth
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            className="min-h-11 font-semibold bg-rose-600/80 hover:bg-rose-600 border-rose-500/40 text-white"
          >
            {isLoading ? "Signing out everywhere..." : "Sign out of all devices"}
          </GlassButton>

          <GlassButton
            variant="ghost"
            size="md"
            fullWidth
            onClick={onClose}
            disabled={isLoading}
            className="min-h-10 text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
};
