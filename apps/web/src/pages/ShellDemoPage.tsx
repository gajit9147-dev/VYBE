import React, { useEffect, useState } from "react";
import {
  Layers,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useAppLayout } from "@/layouts/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { RightRail } from "@/components/layout/RightRail";
import { GlassCard, GlassCardHeader, GlassCardContent } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassDivider } from "@/components/ui/GlassDivider";
import { useToast } from "@/components/feedback";

export const ShellDemoPage: React.FC = () => {
  const { setTitle, setSubtitle, setRightRail, setHeaderAction } = useAppLayout();
  const toast = useToast();
  const [showRightRail, setShowRightRail] = useState(true);

  // Sync shell header details
  useEffect(() => {
    setTitle("Shell Architecture");
    setSubtitle("Responsive Navigation, Scroll Management & Safe-Area Verification");

    setHeaderAction(
      <GlassButton
        size="sm"
        variant="secondary"
        leftIcon={<Sliders className="w-3.5 h-3.5" />}
        onClick={() => setShowRightRail((prev) => !prev)}
      >
        Toggle Right Rail
      </GlassButton>
    );

    return () => {
      setHeaderAction(undefined);
    };
  }, [setTitle, setSubtitle, setHeaderAction]);

  // Sync optional RightRail
  useEffect(() => {
    if (showRightRail) {
      setRightRail(
        <RightRail title="Contextual Right Rail">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Contextual Panel</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This panel is rendered only on large desktop screens (1280px+) and collapses cleanly on tablet and mobile viewports.
            </p>
            <GlassDivider />
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Active Architecture
              </span>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Desktop Sidebar (256px)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fixed Mobile Bottom Nav</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>env(safe-area-inset)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Content Clearance Padding</span>
                </div>
              </div>
            </div>
            <GlassButton
              fullWidth
              size="sm"
              variant="primary"
              onClick={() => toast.info("Right rail contextual action executed")}
            >
              Simulate Context Action
            </GlassButton>
          </div>
        </RightRail>
      );
    } else {
      setRightRail(undefined);
    }

    return () => {
      setRightRail(undefined);
    };
  }, [showRightRail, setRightRail, toast]);

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title="App Shell & Layout Verification"
        subtitle="Verifying viewport adaptation across mobile, tablet, and desktop breakpoints."
        badge={<GlassBadge variant="pink" size="sm" dot>Step 03 Verified</GlassBadge>}
        action={
          <GlassButton
            size="sm"
            variant="primary"
            onClick={() => toast.success("Shell layout state is verified.", "Layout Responsive")}
          >
            Trigger Feedback Toast
          </GlassButton>
        }
      />

      <div className="space-y-8">
        {/* 1. Viewport Adaptation Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard variant="default" padding="md" className="space-y-3">
            <GlassCardHeader>
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-rose-400" />
                <h2 className="text-sm font-bold text-white">Mobile Viewport</h2>
              </div>
              <GlassBadge variant="peach" size="sm">360px – 767px</GlassBadge>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Sticky MobileHeader with logo & title.</li>
                <li>Fixed bottom navigation bar with safe-area bottom padding.</li>
                <li>44px minimum touch targets for fingers.</li>
                <li>Sidebar and Right Rail hidden.</li>
              </ul>
            </GlassCardContent>
          </GlassCard>

          <GlassCard variant="default" padding="md" className="space-y-3">
            <GlassCardHeader>
              <div className="flex items-center gap-2.5">
                <Tablet className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm font-bold text-white">Tablet Viewport</h2>
              </div>
              <GlassBadge variant="purple" size="sm">768px – 1023px</GlassBadge>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Expanded horizontal content padding.</li>
                <li>Single column flow without rail clutter.</li>
                <li>Touch-optimized controls.</li>
                <li>Natural vertical scroll without double bars.</li>
              </ul>
            </GlassCardContent>
          </GlassCard>

          <GlassCard variant="default" padding="md" className="space-y-3">
            <GlassCardHeader>
              <div className="flex items-center gap-2.5">
                <Monitor className="w-5 h-5 text-sky-400" />
                <h2 className="text-sm font-bold text-white">Desktop Viewport</h2>
              </div>
              <GlassBadge variant="blue" size="sm">1024px – 1440px+</GlassBadge>
            </GlassCardHeader>
            <GlassCardContent>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Semantic DesktopSidebar with full navigation.</li>
                <li>Desktop TopBar with status & action triggers.</li>
                <li>Optional contextual Right Rail on xl screens.</li>
                <li>Bottom navigation automatically hidden.</li>
              </ul>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* 2. Scroll Architecture & Bottom Nav Clearance */}
        <GlassCard variant="strong" padding="lg" className="space-y-4">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-pink-400" />
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Scroll Architecture & Safe-Area Clearance
              </h2>
              <p className="text-xs text-slate-400">
                Guaranteed zero overlapping navigation and zero nested scroll lockups.
              </p>
            </div>
          </div>

          <GlassDivider />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-300">
            <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-2">
              <h3 className="font-semibold text-white">Content Clearance</h3>
              <p className="leading-relaxed">
                The <code>ContentArea</code> wrapper enforces bottom clearance padding (<code>pb-24 lg:pb-8</code>) so interactive elements on mobile devices are never obscured behind the fixed bottom navigation bar.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 space-y-2">
              <h3 className="font-semibold text-white">Safe-Area Insets</h3>
              <p className="leading-relaxed">
                Modern mobile devices with home indicator bars (e.g. iPhone, modern Android gesture navigation) receive safe-area spacing using <code>env(safe-area-inset-bottom)</code> and <code>env(safe-area-inset-top)</code>.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-mono">
              Status: Right Rail is {showRightRail ? "Enabled" : "Disabled"}
            </span>
            <GlassButton
              size="sm"
              variant="secondary"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => setShowRightRail((p) => !p)}
            >
              {showRightRail ? "Hide Right Rail" : "Show Right Rail"}
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    </PageContainer>
  );
};
