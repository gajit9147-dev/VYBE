import React from "react";
import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";

export const ErrorPage: React.FC = () => {
  const error = useRouteError();

  let errorMessage = "An unexpected error occurred.";
  let status = 500;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    errorMessage = error.statusText || error.data?.message || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-20 text-center text-slate-100">
      <h1 className="text-5xl font-extrabold text-red-500">{status}</h1>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-400 max-w-md">{errorMessage}</p>
      <div className="mt-6 flex gap-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium text-white transition-colors"
        >
          Reload Page
        </button>
        <Link
          to="/"
          className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-sm font-medium text-white transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};
