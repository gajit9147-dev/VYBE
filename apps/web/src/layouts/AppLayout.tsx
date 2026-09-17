import React, { createContext, useContext, useState } from "react";
import { Outlet } from "react-router-dom";
import { LiquidBackground } from "@/components/layout/LiquidBackground";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ContentArea } from "@/components/layout/ContentArea";
import { UserAccountMenu } from "@/components/layout/UserAccountMenu";

export interface AppLayoutContextValue {
  title: string;
  setTitle: (title: string) => void;
  subtitle?: string;
  setSubtitle: (subtitle?: string) => void;
  showBack: boolean;
  setShowBack: (show: boolean) => void;
  headerAction?: React.ReactNode;
  setHeaderAction: (action?: React.ReactNode) => void;
  rightRail?: React.ReactNode;
  setRightRail: (rail?: React.ReactNode) => void;
}

const AppLayoutContext = createContext<AppLayoutContextValue | null>(null);

export const useAppLayout = (): AppLayoutContextValue => {
  const ctx = useContext(AppLayoutContext);
  if (!ctx) {
    throw new Error("useAppLayout must be used within an AppLayout");
  }
  return ctx;
};

export const AppLayout: React.FC = () => {
  const [title, setTitle] = useState<string>("Discover");
  const [subtitle, setSubtitle] = useState<string | undefined>("Real People. Meaningful Connections.");
  const [showBack, setShowBack] = useState<boolean>(false);
  const [headerAction, setHeaderAction] = useState<React.ReactNode>(undefined);
  const [rightRail, setRightRail] = useState<React.ReactNode>(undefined);

  return (
    <AppLayoutContext.Provider
      value={{
        title,
        setTitle,
        subtitle,
        setSubtitle,
        showBack,
        setShowBack,
        headerAction,
        setHeaderAction,
        rightRail,
        setRightRail
      }}
    >
      <LiquidBackground>
        <div className="flex min-h-screen antialiased selection:bg-rose-500 selection:text-white">
          {/* Desktop Left Sidebar (hidden on mobile/tablet) */}
          <DesktopSidebar />

          {/* Main Column */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Desktop TopBar */}
            <TopBar title={title} subtitle={subtitle} actions={headerAction} />

            {/* Mobile Header (hidden on desktop) */}
            <MobileHeader
              title={title}
              showBack={showBack}
              action={headerAction || <UserAccountMenu variant="header" />}
              showLogo={!showBack}
            />

            {/* Content row with optional Right Rail */}
            <div className="flex-1 flex min-w-0">
              <ContentArea>
                <Outlet />
              </ContentArea>

              {/* Optional Right Rail (hidden on mobile and tablet) */}
              {rightRail}
            </div>
          </div>

          {/* Mobile Bottom Navigation (fixed at bottom, hidden on desktop) */}
          <MobileBottomNav />
        </div>
      </LiquidBackground>
    </AppLayoutContext.Provider>
  );
};
