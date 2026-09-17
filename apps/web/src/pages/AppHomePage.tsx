import React from "react";

export const AppHomePage: React.FC = () => {
  return (
    <div className="py-8">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">VYBE Dashboard</h1>
        <p className="mt-2 text-slate-400">
          Frontend architecture is initialized. Future features (Discovery, Matches, Chat, Profile, Dates) will be connected here.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-white/5 bg-slate-950/60">
            <h2 className="text-sm font-semibold text-slate-200">Discovery</h2>
            <p className="mt-1 text-xs text-slate-400">Question-first match feed</p>
          </div>
          <div className="p-4 rounded-xl border border-white/5 bg-slate-950/60">
            <h2 className="text-sm font-semibold text-slate-200">Matches</h2>
            <p className="mt-1 text-xs text-slate-400">Mutual connections</p>
          </div>
          <div className="p-4 rounded-xl border border-white/5 bg-slate-950/60">
            <h2 className="text-sm font-semibold text-slate-200">Chat</h2>
            <p className="mt-1 text-xs text-slate-400">Realtime messaging</p>
          </div>
          <div className="p-4 rounded-xl border border-white/5 bg-slate-950/60">
            <h2 className="text-sm font-semibold text-slate-200">Profile</h2>
            <p className="mt-1 text-xs text-slate-400">Interests & Questions</p>
          </div>
        </div>
      </div>
    </div>
  );
};
