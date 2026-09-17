import React from "react";
import {
  Compass,
  MessageSquareQuote,
  Heart,
  MessageCircle,
  User
} from "lucide-react";
import { mobileNavigation } from "@/config/navigation";
import { NavigationItem } from "./NavigationItem";

const iconMap: Record<string, React.ReactNode> = {
  discover: <Compass className="w-5 h-5" />,
  answers: <MessageSquareQuote className="w-5 h-5" />,
  matches: <Heart className="w-5 h-5" />,
  messages: <MessageCircle className="w-5 h-5" />,
  profile: <User className="w-5 h-5" />
};

export const MobileBottomNav: React.FC = () => {
  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/85 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.5)] pb-[env(safe-area-inset-bottom,0.5rem)]"
    >
      <div className="flex items-center justify-around px-2 h-16 max-w-lg mx-auto">
        {mobileNavigation.map((item) => (
          <NavigationItem
            key={item.id}
            item={item}
            icon={iconMap[item.id]}
            variant="bottom-nav"
          />
        ))}
      </div>
    </nav>
  );
};
