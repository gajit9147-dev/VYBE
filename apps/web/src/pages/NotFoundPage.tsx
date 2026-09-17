import React from "react";
import { Link } from "react-router-dom";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-6xl font-black text-pink-500">404</h1>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-400 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium text-white transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
};
