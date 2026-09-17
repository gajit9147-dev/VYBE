import { createBrowserRouter } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { WelcomePage } from "@/features/landing";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { VerifyEmailPage } from "@/pages/VerifyEmailPage";
import { VerifyPhonePage } from "@/pages/VerifyPhonePage";
import { AppHomePage } from "@/pages/AppHomePage";
import { ShellDemoPage } from "@/pages/ShellDemoPage";
import { DesignSystemPage } from "@/pages/DesignSystemPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ErrorPage } from "@/pages/ErrorPage";
import { GuestOnlyRoute } from "@/features/auth/components/PublicAuthRoute";
import { VerifiedRoute } from "@/features/auth/components/VerifiedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorPage />,
    children: [
      // Public Route Tier
      {
        element: <PublicLayout />,
        children: [
          {
            index: true,
            element: <WelcomePage />,
          },
          {
            path: "design-system",
            element: <DesignSystemPage />,
          },
        ],
      },
      // Auth Route Tier
      {
        path: "auth",
        element: <AuthLayout />,
        children: [
          // Public auth screens guarded against already-verified authenticated users
          {
            element: <GuestOnlyRoute />,
            children: [
              {
                path: "login",
                element: <LoginPage />,
              },
              {
                path: "register",
                element: <RegisterPage />,
              },
            ],
          },
          // Email Verification screens (handles unverified users and token confirmation)
          {
            path: "verify-email",
            element: <VerifyEmailPage />,
          },
          {
            path: "verify-email/confirm",
            element: <VerifyEmailPage />,
          },
          {
            path: "verify-phone",
            element: (
              <VerifiedRoute>
                <VerifyPhonePage />
              </VerifiedRoute>
            ),
          },
        ],
      },
      // Authenticated App Route Tier (protected against unauthenticated users)
      {
        path: "app",
        element: (
          <VerifiedRoute>
            <AppLayout />
          </VerifiedRoute>
        ),
        children: [
          {
            index: true,
            element: <AppHomePage />,
          },
          {
            path: "discover",
            element: <AppHomePage />,
          },
          {
            path: "shell-demo",
            element: <ShellDemoPage />,
          },
        ],
      },
      // Catch-all 404 Route
      {
        path: "*",
        element: <PublicLayout />,
        children: [
          {
            path: "*",
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
]);
