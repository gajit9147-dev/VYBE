import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ShieldAlert, CheckCircle2, AlertCircle, ChevronUp, MoreVertical } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { GlassAvatar } from "@/components/ui/GlassAvatar";
import { GlassIconButton } from "@/components/ui/GlassIconButton";
import { LogoutAllModal } from "@/features/auth/components/LogoutAllModal";
import { useToast } from "@/components/feedback";

export interface UserAccountMenuProps {
  variant?: "sidebar" | "header" | "compact";
  className?: string;
}

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({
  variant = "sidebar",
  className = ""
}) => {
  const { user, logout, isLoggingOut, logoutAll, isLoggingOutAll } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutAllOpen, setIsLogoutAllOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.email?.split("@")[0] || "User";
  const isVerified = Boolean(user?.isVerified);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      setIsOpen(false);
      await logout();
      toast.info("You have been signed out.", "Signed Out");
      navigate("/auth/login", { replace: true });
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
      setIsLogoutAllOpen(false);
      toast.info("Signed out of all devices successfully.", "Sessions Cleared");
      navigate("/auth/login", { replace: true });
    } catch {
      toast.error("Failed to sign out of all devices.");
    }
  };

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* Trigger button */}
      {variant === "sidebar" ? (
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-full vybe-glass-capsule hover:bg-white/[0.08] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <GlassAvatar
              size="sm"
              fallbackName={displayName}
              isOnline={isVerified}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-white truncate capitalize">{displayName}</p>
                {isVerified ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || "Member"}</p>
            </div>
          </div>

          <ChevronUp
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      ) : (
        <GlassIconButton
          aria-label="Account and session settings"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          icon={<MoreVertical className="w-4 h-4 text-slate-300" />}
          size="sm"
          variant="ghost"
          onClick={() => setIsOpen((prev) => !prev)}
        />
      )}

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute z-50 w-60 p-2 rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-2xl space-y-1 ${
            variant === "sidebar" ? "bottom-full mb-2 left-0" : "top-full mt-2 right-0"
          }`}
        >
          {/* Identity Header */}
          <div className="px-3 py-2 border-b border-white/5 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Account</p>
            <p className="text-xs text-white font-medium truncate">{user?.email || "User"}</p>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isVerified ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}
              />
              <span className="text-[10px] text-slate-300">
                {isVerified ? "Verified Account" : "Verification Pending"}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="pt-1 space-y-0.5">
            {/* Standard Logout */}
            <button
              type="button"
              role="menuitem"
              disabled={isLoggingOut || isLoggingOutAll}
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-50 text-left"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>{isLoggingOut ? "Signing out..." : "Log out"}</span>
            </button>

            {/* Logout from all devices */}
            <button
              type="button"
              role="menuitem"
              disabled={isLoggingOut || isLoggingOutAll}
              onClick={() => {
                setIsOpen(false);
                setIsLogoutAllOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50 text-left"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign out of all devices</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Logout-All */}
      <LogoutAllModal
        isOpen={isLogoutAllOpen}
        onClose={() => setIsLogoutAllOpen(false)}
        onConfirm={handleLogoutAll}
        isLoading={isLoggingOutAll}
      />
    </div>
  );
};
