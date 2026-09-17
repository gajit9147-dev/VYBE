import React from "react";
import { NavLink } from "react-router-dom";
import { NavigationItemConfig } from "@/config/navigation";

export interface NavigationItemProps {
  item: NavigationItemConfig;
  icon: React.ReactNode;
  variant?: "sidebar" | "bottom-nav";
  onClick?: () => void;
  className?: string;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
  item,
  icon,
  variant = "sidebar",
  onClick,
  className = ""
}) => {
  if (variant === "bottom-nav") {
    return (
      <NavLink
        to={item.route}
        end={item.route === "/app"}
        onClick={onClick}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 py-2 px-1 min-h-[44px] touch-manipulation transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-xl ${
            isActive
              ? "text-white"
              : "text-slate-400 hover:text-slate-200"
          } ${className}`
        }
      >
        {({ isActive }) => (
          <div className="relative flex flex-col items-center gap-1">
            <div
              className={`p-1 rounded-xl transition-all duration-150 ${
                isActive
                  ? "bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.35)]"
                  : ""
              }`}
            >
              {icon}
            </div>

            <span
              className={`text-[10px] font-medium tracking-tight leading-none ${
                isActive ? "text-white font-semibold" : "text-slate-400"
              }`}
            >
              {item.label}
            </span>

            {item.badge !== undefined && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                {item.badge}
              </span>
            )}
          </div>
        )}
      </NavLink>
    );
  }

  // Sidebar item
  return (
    <NavLink
      to={item.route}
      end={item.route === "/app"}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
          isActive
            ? "bg-gradient-to-r from-rose-500/20 to-purple-600/15 border border-pink-500/30 text-white shadow-[0_0_16px_rgba(244,63,94,0.2)]"
            : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
        } ${className}`
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`shrink-0 transition-colors ${
                isActive ? "text-rose-400" : "text-slate-400 group-hover:text-slate-200"
              }`}
            >
              {icon}
            </span>
            <span className="truncate">{item.label}</span>
          </div>

          {item.badge !== undefined && (
            <span
              className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${
                isActive
                  ? "bg-rose-500/30 text-rose-200 border border-rose-400/30"
                  : "bg-white/10 text-slate-400"
              }`}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};
