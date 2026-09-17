import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Compass, MessageSquareQuote, Heart, MessageCircle, Layers, ArrowRight } from "lucide-react";
import { useAppLayout } from "@/layouts/AppLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard, GlassCardHeader, GlassCardContent } from "@/components/ui/GlassCard";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { GlassButton } from "@/components/ui/GlassButton";

export const AppHomePage: React.FC = () => {
  const { setTitle, setSubtitle } = useAppLayout();

  useEffect(() => {
    setTitle("Discover");
    setSubtitle("Explore authentic questions and meaningful vibes nearby.");
  }, [setTitle, setSubtitle]);

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title="Discover Feed"
        subtitle="Question-first connections based on authentic answers and mutual values."
        badge={<GlassBadge variant="pink" size="sm" dot>Feed Active</GlassBadge>}
        action={
          <Link to="/app/shell-demo">
            <GlassButton
              size="sm"
              variant="secondary"
              leftIcon={<Layers className="w-3.5 h-3.5 text-pink-400" />}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Inspect Shell Architecture
            </GlassButton>
          </Link>
        }
      />

      <div className="space-y-6">
        {/* Foundation Status Banner */}
        <GlassCard variant="strong" padding="md" className="border-pink-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white tracking-tight">
                Responsive App Shell Active
              </h2>
              <p className="text-xs text-slate-300">
                The desktop sidebar, topbar, mobile header, and fixed bottom navigation are fully operational.
              </p>
            </div>
            <Link to="/app/shell-demo">
              <GlassButton variant="primary" size="sm">
                View Shell Demo
              </GlassButton>
            </Link>
          </div>
        </GlassCard>

        {/* Feature Grid Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard variant="interactive" padding="md">
            <GlassCardHeader>
              <Compass className="w-5 h-5 text-rose-400" />
              <GlassBadge variant="pink" size="sm">Active</GlassBadge>
            </GlassCardHeader>
            <GlassCardContent>
              <h3 className="text-sm font-semibold text-white">Discovery Stream</h3>
              <p className="text-xs text-slate-400">
                Algorithmic and preference-based question-first profile feed.
              </p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard variant="interactive" padding="md">
            <GlassCardHeader>
              <MessageSquareQuote className="w-5 h-5 text-purple-400" />
              <GlassBadge variant="purple" size="sm">Prompts</GlassBadge>
            </GlassCardHeader>
            <GlassCardContent>
              <h3 className="text-sm font-semibold text-white">Open-Ended Answers</h3>
              <p className="text-xs text-slate-400">
                Express yourself through deep, spontaneous questions.
              </p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard variant="interactive" padding="md">
            <GlassCardHeader>
              <Heart className="w-5 h-5 text-rose-400" />
              <GlassBadge variant="peach" size="sm">Mutual</GlassBadge>
            </GlassCardHeader>
            <GlassCardContent>
              <h3 className="text-sm font-semibold text-white">Mutual Matches</h3>
              <p className="text-xs text-slate-400">
                Connect when both individuals find resonance in answers.
              </p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard variant="interactive" padding="md">
            <GlassCardHeader>
              <MessageCircle className="w-5 h-5 text-sky-400" />
              <GlassBadge variant="blue" size="sm">Realtime</GlassBadge>
            </GlassCardHeader>
            <GlassCardContent>
              <h3 className="text-sm font-semibold text-white">Conversations</h3>
              <p className="text-xs text-slate-400">
                End-to-end realtime messaging with presence and read receipts.
              </p>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </PageContainer>
  );
};
