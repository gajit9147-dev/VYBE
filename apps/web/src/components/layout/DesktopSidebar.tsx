import React from "react";
import {
  Compass,
  MessageSquareQuote,
  Heart,
  MessageCircle,
  User,
  Sparkles,
  Flame,
  Settings,
  Layers
} from "lucide-react";
import { primaryNavigation, secondaryNavigation } from "@/config/navigation";
import { NavigationItem } from "./NavigationItem";
import { VYBELogo } from "@/components/ui/VYBELogo";
import { GlassDivider } from "@/components/ui/GlassDivider";
import { UserAccountMenu } from "./UserAccountMenu";

interface DesktopSidebarProps {
  className?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  discover: <Compass className="w-5 h-5" />,
  answers: <MessageSquareQuote className="w-5 h-5" />,
  matches: <Heart className="w-5 h-5" />,
  messages: <MessageCircle className="w-5 h-5" />,
  profile: <User className="w-5 h-5" />,
  "shell-demo": <Layers className="w-5 h-5" />,
  moments: <Sparkles className="w-5 h-5" />,
  surprise: <Flame className="w-5 h-5" />,
  settings: <Settings className="w-5 h-5" />
};

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ className = "" }) => {

  return (
    <aside
      aria-label="Desktop application sidebar"
      className={`hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-white/10 bg-slate-950/70 backdrop-blur-xl shrink-0 z-30 ${className}`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <VYBELogo size="md" showTagline={false} />
      </div>

      {/* Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {/* Primary Navigation */}
        <nav aria-label="Primary navigation" className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Menu
          </div>
          {primaryNavigation.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              icon={iconMap[item.id]}
              variant="sidebar"
            />
          ))}
        </nav>

        <GlassDivider />

        {/* Secondary Navigation */}
        <nav aria-label="Secondary navigation" className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Explore & Tools
          </div>
          {secondaryNavigation.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              icon={iconMap[item.id]}
              variant="sidebar"
            />
          ))}
        </nav>
      </div>

      {/* Bottom Profile Anchor with UserAccountMenu */}
      <div className="p-4 border-t border-white/5 bg-slate-950/40">
        <UserAccountMenu variant="sidebar" />
      </div>
    </aside>
  );
};
