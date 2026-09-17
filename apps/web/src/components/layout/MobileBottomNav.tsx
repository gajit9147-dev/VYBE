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
      className="lg:hidden fixed bottom-3 left-4 right-4 z-40 max-w-md mx-auto vybe-glass-capsule pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="flex items-center justify-around px-3 h-16 w-full">
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
