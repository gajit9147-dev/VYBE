import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  Sparkles,
  Shield,
  User,
  Settings,
  Flame,
  Eye
} from "lucide-react";
import {
  GlassPanel,
  GlassCard,
  GlassCardHeader,
  GlassCardContent,
  GlassCardFooter,
  ProfileCard,
  QuestionCard,
  MatchCard,
  GlassButton,
  GlassIconButton,
  GlassInput,
  GlassTextarea,
  GlassSelect,
  GlassBadge,
  GlassChip,
  GlassAvatar,
  GlassDivider,
  GlassModal,
  GlassSheet,
  GlassTooltip,
  GlassTabs,
  GlassProgress,
  GlassSkeleton,
  GlassSpinner,
  GlassEmptyState,
  GlassErrorState
} from "@/components/ui";
import { useToast } from "@/components/feedback";

export const DesignSystemPage: React.FC = () => {
  const toast = useToast();

  // State for interactive demonstrations
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetSide, setSheetSide] = useState<"right" | "bottom">("right");
  const [activeTab, setActiveTab] = useState("people");
  const [inputValue, setInputValue] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>(["Art & Design", "Coffee"]);
  const [progressVal, setProgressVal] = useState(68);

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  return (
    <div className="space-y-16 py-6">
      {/* Header Introduction */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-pink-500/30 bg-pink-500/10 text-xs font-semibold text-pink-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>VYBE Design System • Liquid Glass v1.0</span>
        </div>

        <h1 className="vybe-display vybe-gradient-text">
          Liquid Glass × Dark Cinematic
        </h1>
        <p className="vybe-body max-w-2xl text-slate-300">
          A centralized, accessible, mobile-first design system created for authentic human connections.
        </p>
      </div>

      <GlassDivider />

      {/* 1. Typography Hierarchy */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="vybe-h2 text-white">1. Typography Hierarchy</h2>
          <span className="text-xs text-slate-400 font-mono">tokens.css</span>
        </div>

        <GlassCard variant="default" className="space-y-4">
          <div className="space-y-1 border-b border-white/5 pb-4">
            <span className="text-xs font-mono text-pink-400">.vybe-display</span>
            <p className="vybe-display text-white">Display Headline</p>
          </div>

          <div className="space-y-1 border-b border-white/5 pb-4">
            <span className="text-xs font-mono text-pink-400">.vybe-h1</span>
            <p className="vybe-h1 text-white">Heading 1 — Real People. Meaningful Connections.</p>
          </div>

          <div className="space-y-1 border-b border-white/5 pb-4">
            <span className="text-xs font-mono text-pink-400">.vybe-h2</span>
            <p className="vybe-h2 text-white">Heading 2 — Question-First Chemistry</p>
          </div>

          <div className="space-y-1 border-b border-white/5 pb-4">
            <span className="text-xs font-mono text-pink-400">.vybe-h3</span>
            <p className="vybe-h3 text-white">Heading 3 — Mutual Match Criteria</p>
          </div>

          <div className="space-y-1 border-b border-white/5 pb-4">
            <span className="text-xs font-mono text-pink-400">.vybe-body</span>
            <p className="vybe-body">
              Body text: Discover authentic relationships based on answers, passions, and reciprocal chemistry rather than superficial swiping.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono text-pink-400">.vybe-caption / .vybe-label</span>
            <div className="flex gap-6 items-center">
              <span className="vybe-label">Label: Email Address</span>
              <span className="vybe-caption">Caption: Last active 12m ago</span>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* 2. Glass Panels & Surface Hierarchy */}
      <section className="space-y-6">
        <h2 className="vybe-h2 text-white">2. Glass Surface Hierarchy</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassPanel variant="subtle" className="p-6">
            <h3 className="text-sm font-semibold text-slate-200">Subtle Glass</h3>
            <p className="text-xs text-slate-400 mt-1">2% opacity, for low-contrast containers.</p>
          </GlassPanel>

          <GlassPanel variant="default" className="p-6">
            <h3 className="text-sm font-semibold text-slate-200">Default Glass</h3>
            <p className="text-xs text-slate-400 mt-1">4% opacity, 16px blur, inner highlight.</p>
          </GlassPanel>

          <GlassPanel variant="strong" className="p-6">
            <h3 className="text-sm font-semibold text-slate-200">Strong Glass</h3>
            <p className="text-xs text-slate-400 mt-1">8% opacity, 24px blur, elevated shadow.</p>
          </GlassPanel>

          <GlassPanel variant="interactive" className="p-6">
            <h3 className="text-sm font-semibold text-slate-200">Interactive Glass</h3>
            <p className="text-xs text-slate-400 mt-1">Hover translation, border brightens.</p>
          </GlassPanel>
        </div>
      </section>

      {/* 3. Button System */}
      <section className="space-y-6">
        <h2 className="vybe-h2 text-white">3. Button System</h2>
        <GlassCard variant="default" className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Variants</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <GlassButton variant="primary" leftIcon={<Heart className="w-4 h-4" />}>
                Primary Action
              </GlassButton>
              <GlassButton variant="secondary">
                Secondary Glass
              </GlassButton>
              <GlassButton variant="ghost">
                Ghost Button
              </GlassButton>
              <GlassButton variant="danger">
                Danger Action
              </GlassButton>
              <GlassButton variant="success">
                Success Action
              </GlassButton>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sizes & States</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <GlassButton size="sm" variant="primary">Small (sm)</GlassButton>
              <GlassButton size="md" variant="primary">Medium (md)</GlassButton>
              <GlassButton size="lg" variant="primary">Large (lg)</GlassButton>
              <GlassButton variant="secondary" isLoading>Loading State</GlassButton>
              <GlassButton variant="secondary" disabled>Disabled State</GlassButton>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Accessible Icon Buttons</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <GlassIconButton
                aria-label="Like profile"
                icon={<Heart className="w-4 h-4 text-rose-400" />}
                variant="secondary"
                size="md"
              />
              <GlassIconButton
                aria-label="Send message"
                icon={<MessageCircle className="w-4 h-4" />}
                variant="primary"
                size="md"
              />
              <GlassIconButton
                aria-label="Safety report"
                icon={<Shield className="w-4 h-4 text-amber-400" />}
                variant="ghost"
                size="md"
              />
              <GlassIconButton
                aria-label="Settings"
                icon={<Settings className="w-4 h-4" />}
                variant="secondary"
                size="sm"
                shape="rounded"
              />
            </div>
          </div>
        </GlassCard>
      </section>

      {/* 4. Form Inputs */}
      <section className="space-y-6">
        <h2 className="vybe-h2 text-white">4. Form Controls</h2>
        <GlassCard variant="default" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <GlassInput
            label="Full Name"
            placeholder="Ajeet Gupta"
            leftIcon={<User className="w-4 h-4" />}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            description="Your public display name."
          />

          <GlassInput
            label="Email Address"
            placeholder="ajeet@example.com"
            error="Please enter a valid email address."
            defaultValue="invalid-email"
            required
          />

          <GlassSelect
            label="Looking For"
            options={[
              { value: "long-term", label: "Long-term partnership" },
              { value: "dating", label: "Dating & Romance" },
              { value: "friends", label: "Meaningful Friends" }
            ]}
          />

          <div className="sm:col-span-2 lg:col-span-3">
            <GlassTextarea
              label="Bio / Prompt"
              placeholder="Tell others what makes you tick, your favorite weekend ritual, or book recommendation..."
              description="Keep it authentic. Up to 500 characters."
            />
          </div>
        </GlassCard>
      </section>

      {/* 5. Domain Cards Showcase */}
      <section className="space-y-6">
        <h2 className="vybe-h2 text-white">5. Reusable Domain Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Discovery Profile Card */}
          <ProfileCard
            name="Maya Lin"
            age={26}
            location="San Francisco, CA"
            bio="Architectural designer who loves vinyl jazz, cold brews, and spontaneous weekend hikes."
            intent="Long-term partner"
            isVerified
            interests={["Architecture", "Jazz", "Hiking", "Coffee"]}
            footerAction={
              <div className="flex gap-2">
                <GlassButton variant="secondary" size="sm" className="flex-1" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                  View
                </GlassButton>
                <GlassButton variant="primary" size="sm" className="flex-1" leftIcon={<Flame className="w-3.5 h-3.5" />}>
                  Connect
                </GlassButton>
              </div>
            }
          />

          {/* Question & Answer Card */}
          <div className="space-y-4">
            <QuestionCard
              category="Life Perspective"
              question="What is one non-negotiable value you look for in people?"
              answer="Emotional honesty and how someone treats service staff when things go wrong."
              authorName="Maya"
              action={
                <GlassButton variant="ghost" size="sm" leftIcon={<Heart className="w-3 h-3 text-pink-400" />}>
                  24
                </GlassButton>
              }
            />

            <QuestionCard
              category="Spontaneous Moment"
              question="The most unexpected thing I learned this year is..."
              answer="You can't rush connection; authentic chemistry builds when you stop trying to impress."
              authorName="Julian"
            />
          </div>

          {/* Mutual Match Card */}
          <div className="space-y-4">
            <MatchCard
              name="Sophie Chen"
              matchScore={94}
              commonInterests={["Indie Cinema", "Coffee", "Photography"]}
              matchedAt="2h ago"
              onChatClick={() => toast.success("Chat opened with Sophie!", "Match Connected")}
              onProfileClick={() => toast.info("Opening Sophie's full profile...")}
            />

            {/* Standard Glass Card Container */}
            <GlassCard variant="default" padding="md">
              <GlassCardHeader>
                <h3 className="text-sm font-bold text-white">Chemistry Summary</h3>
                <GlassBadge variant="pink" size="sm">Active</GlassBadge>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-xs text-slate-300">
                  You both share 3 prompt answers and 5 mutual interests.
                </p>
              </GlassCardContent>
              <GlassCardFooter>
                <span className="text-[11px] text-slate-500">Updated just now</span>
                <GlassButton variant="ghost" size="sm">Details</GlassButton>
              </GlassCardFooter>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* 6. Badges & Interactive Chips */}
      <section className="space-y-6">
        <h2 className="vybe-h2 text-white">6. Badges & Chips</h2>
        <GlassCard variant="default" className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status Badges</h3>
            <div className="flex flex-wrap gap-2.5 items-center">
              <GlassBadge variant="pink" dot>Verified</GlassBadge>
              <GlassBadge variant="peach" dot>Intent: Romance</GlassBadge>
              <GlassBadge variant="purple" dot>New Prompt</GlassBadge>
              <GlassBadge variant="blue" dot>Online Now</GlassBadge>
              <GlassBadge variant="success" dot>Matched</GlassBadge>
              <GlassBadge variant="warning" dot>Pending Approval</GlassBadge>
              <GlassBadge variant="danger" dot>Action Required</GlassBadge>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Interactive Interest Chips (Selectable)
            </h3>
            <div className="flex flex-wrap gap-2 items-center">
              {[
                "Art & Design",
                "Coffee",
                "Indie Music",
                "Photography",
                "Philosophy",
                "Travel",
                "Culinary",
                "Sci-Fi Books"
              ].map((interest) => (
                <GlassChip
                  key={interest}
                  label={interest}
                  isSelected={selectedChips.includes(interest)}
                  onToggle={() => toggleChip(interest)}
                  onRemove={selectedChips.includes(interest) ? () => toggleChip(interest) : undefined}
                />
              ))}
            </div>
          </div>
        </GlassCard>
      </section>

      {/* 7. Avatars */}
      <section className="space-y-6">
        <h2 className="vybe-h2 text-white">7. Avatar System</h2>
        <GlassCard variant="default" className="space-y-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center space-y-1">
              <GlassAvatar size="xs" fallbackName="Ajeet" />
              <span className="block text-[10px] text-slate-400">xs</span>
            </div>
            <div className="text-center space-y-1">
              <GlassAvatar size="sm" fallbackName="Sophie Chen" isOnline />
              <span className="block text-[10px] text-slate-400">sm (online)</span>
            </div>
            <div className="text-center space-y-1">
              <GlassAvatar size="md" fallbackName="Maya Lin" isVerified />
              <span className="block text-[10px] text-slate-400">md (verified)</span>
            </div>
            <div className="text-center space-y-1">
              <GlassAvatar size="lg" fallbackName="Julian Ross" isOnline />
              <span className="block text-[10px] text-slate-400">lg</span>
            </div>
            <div className="text-center space-y-1">
              <GlassAvatar size="xl" fallbackName="VYBE Platform" isVerified />
              <span className="block text-[10px] text-slate-400">xl</span>
            </div>
            <div className="text-center space-y-1">
              <GlassAvatar size="2xl" fallbackName="Elena Vance" isOnline />
              <span className="block text-[10px] text-slate-400">2xl</span>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* 8. Tabs, Progress & Tooltip */}
      <section className="space-y-6">
        <h2 className="vybe-h2 text-white">8. Tabs, Progress & Tooltip</h2>
        <GlassCard variant="default" className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Accessible Tabs</h3>
            <GlassTabs
              tabs={[
                { id: "people", label: "People", icon: <User className="w-3.5 h-3.5" />, count: 18 },
                { id: "answers", label: "Answers", icon: <MessageCircle className="w-3.5 h-3.5" />, count: 5 },
                { id: "moments", label: "Moments", icon: <Sparkles className="w-3.5 h-3.5" /> },
                { id: "surprise", label: "Surprise", icon: <Flame className="w-3.5 h-3.5" /> }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Progress Indicator
              </h3>
              <div className="flex gap-2">
                <GlassButton
                  size="sm"
                  variant="secondary"
                  onClick={() => setProgressVal((p) => Math.max(0, p - 10))}
                >
                  -10%
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="secondary"
                  onClick={() => setProgressVal((p) => Math.min(100, p + 10))}
                >
                  +10%
                </GlassButton>
              </div>
            </div>
            <GlassProgress value={progressVal} label="Profile Chemistry Strength" showLabel />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contextual Tooltip</h3>
            <div>
              <GlassTooltip content="Verified profiles have authenticated their phone and photo badge.">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-200 hover:bg-white/10 transition-colors"
                >
                  Hover or Focus for Tooltip
                </button>
              </GlassTooltip>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* 9. Feedback & Toast System */}
      <section className="space-y-6">
        <h2 className="vybe-h2 text-white">9. Feedback & Toast Notifications</h2>
        <GlassCard variant="default" className="space-y-4">
          <p className="text-xs text-slate-300">
            Trigger non-intrusive notifications positioned cleanly in desktop and mobile viewports.
          </p>
          <div className="flex flex-wrap gap-3">
            <GlassButton
              variant="success"
              onClick={() => toast.success("Your answer was saved successfully.", "Prompt Answered")}
            >
              Show Success Toast
            </GlassButton>
            <GlassButton
              variant="danger"
              onClick={() => toast.error("Could not upload photo. Please check file size.", "Upload Failed")}
            >
              Show Error Toast
            </GlassButton>
            <GlassButton
              variant="secondary"
              onClick={() => toast.warning("Your session will expire in 5 minutes.", "Session Expiring")}
            >
              Show Warning Toast
            </GlassButton>
            <GlassButton
              variant="secondary"
              onClick={() => toast.info("Sophie Chen liked your answer to 'Favorite travel story'.", "New Activity")}
            >
              Show Info Toast
            </GlassButton>
          </div>
        </GlassCard>
      </section>

      {/* 10. Modal & Bottom Sheet Triggers */}
      <section className="space-y-6">
        <h2 className="vybe-h2 text-white">10. Overlays & Bottom Sheets</h2>
        <GlassCard variant="default" className="flex flex-wrap gap-4">
          <GlassButton
            variant="primary"
            onClick={() => setModalOpen(true)}
          >
            Open Glass Modal
          </GlassButton>

          <GlassButton
            variant="secondary"
            onClick={() => {
              setSheetSide("right");
              setSheetOpen(true);
            }}
          >
            Open Side Sheet (Desktop)
          </GlassButton>

          <GlassButton
            variant="secondary"
            onClick={() => {
              setSheetSide("bottom");
              setSheetOpen(true);
            }}
          >
            Open Bottom Sheet (Mobile-Adaptive)
          </GlassButton>
        </GlassCard>

        {/* Glass Modal Instance */}
        <GlassModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Mutual Chemistry Filter"
          description="Refine your discovery feed based on verified questions and shared intentions."
        >
          <div className="space-y-4">
            <GlassSelect
              label="Minimum Question Overlap"
              options={[
                { value: "1", label: "At least 1 answered question" },
                { value: "3", label: "At least 3 answered questions" },
                { value: "5", label: "High depth (5+ answers)" }
              ]}
            />
            <GlassInput label="Location Radius" placeholder="Within 25 km" />
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <GlassButton variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={() => {
                  setModalOpen(false);
                  toast.success("Discovery filters applied!", "Filters Updated");
                }}
              >
                Apply Filters
              </GlassButton>
            </div>
          </div>
        </GlassModal>

        {/* Glass Sheet Instance */}
        <GlassSheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          side={sheetSide}
          title={sheetSide === "bottom" ? "Quick Actions Sheet" : "Profile Details Drawer"}
          description="Seamlessly view layered information without navigating away from the current view."
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <GlassAvatar size="lg" fallbackName="Maya Lin" isVerified />
              <div>
                <h3 className="text-base font-bold text-white">Maya Lin, 26</h3>
                <p className="text-xs text-slate-400">San Francisco • Verified Profile</p>
              </div>
            </div>

            <GlassDivider />

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-pink-400">About Maya</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Looking for genuine connection, deep conversations, and someone who appreciates good design and spontaneous adventures.
              </p>
            </div>

            <div className="space-y-3">
              <GlassButton
                fullWidth
                variant="primary"
                leftIcon={<MessageCircle className="w-4 h-4" />}
                onClick={() => {
                  setSheetOpen(false);
                  toast.success("Starting conversation with Maya...");
                }}
              >
                Send Direct Message
              </GlassButton>
              <GlassButton
                fullWidth
                variant="ghost"
                onClick={() => setSheetOpen(false)}
              >
                Dismiss
              </GlassButton>
            </div>
          </div>
        </GlassSheet>
      </section>

      {/* 11. Loading Skeletons */}
      <section className="space-y-6">
        <h2 className="vybe-h2 text-white">11. Loading States & Skeletons</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard variant="default" className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Card Skeleton</h3>
            <GlassSkeleton variant="card" />
          </GlassCard>

          <GlassCard variant="default" className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Profile Skeleton</h3>
            <div className="flex items-center gap-3">
              <GlassSkeleton variant="circular" width={48} height={48} />
              <div className="flex-1 space-y-2">
                <GlassSkeleton variant="text" width="60%" />
                <GlassSkeleton variant="text" width="40%" />
              </div>
            </div>
            <GlassSkeleton variant="rectangular" height={80} />
          </GlassCard>

          <GlassCard variant="default" className="space-y-4 flex flex-col items-center justify-center p-8">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Spinner Variants</h3>
            <div className="flex items-center gap-6">
              <GlassSpinner size="sm" />
              <GlassSpinner size="md" />
              <GlassSpinner size="lg" />
            </div>
          </GlassCard>
        </div>
      </section>

      {/* 12. Empty & Error States */}
      <section className="space-y-6">
        <h2 className="vybe-h2 text-white">12. Empty & Error States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassEmptyState
            title="No new people in your area"
            description="You've seen all nearby profiles matching your current filters. Expand your preferences or check back later."
            action={
              <GlassButton variant="primary" size="sm" onClick={() => toast.info("Filters reset to default")}>
                Expand Search Range
              </GlassButton>
            }
          />

          <GlassErrorState
            title="Connection interrupted"
            message="We were unable to load the discovery stream. Please verify your connection."
            onRetry={() => toast.info("Retrying discovery connection...")}
          />
        </div>
      </section>
    </div>
  );
};
