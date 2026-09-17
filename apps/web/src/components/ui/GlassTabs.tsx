import React from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface GlassTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  ariaLabel?: string;
}

export const GlassTabs: React.FC<GlassTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = "",
  ariaLabel = "Navigation tabs"
}) => {
  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else {
      return;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (nextTab && !nextTab.disabled) {
      onChange(nextTab.id);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md overflow-x-auto max-w-full ${className}`}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 whitespace-nowrap cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
              isActive
                ? "bg-gradient-to-r from-rose-500/20 to-purple-600/20 text-white border border-pink-500/30 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            } ${tab.disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""}`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-pink-500/30 text-pink-200" : "bg-white/10 text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
