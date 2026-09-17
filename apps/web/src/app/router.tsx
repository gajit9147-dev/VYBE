import { createBrowserRouter } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { AppLayout } from "@/layouts/AppLayout";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { AppHomePage } from "@/pages/AppHomePage";
import { ShellDemoPage } from "@/pages/ShellDemoPage";
import { DesignSystemPage } from "@/pages/DesignSystemPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ErrorPage } from "@/pages/ErrorPage";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { PublicAuthRoute } from "@/features/auth/components/PublicAuthRoute";

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
            element: <LandingPage />
          },
          {
            path: "design-system",
            element: <DesignSystemPage />
          }
        ]
      },
      // Auth Route Tier (protected against already-authenticated users)
      {
        path: "auth",
        element: (
          <PublicAuthRoute>
            <AuthLayout />
          </PublicAuthRoute>
        ),
        children: [
          {
            path: "login",
            element: <LoginPage />
          },
          {
            path: "register",
            element: <RegisterPage />
          }
        ]
      },
      // Authenticated App Route Tier (protected against unauthenticated users)
      {
        path: "app",
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <AppHomePage />
          },
          {
            path: "discover",
            element: <AppHomePage />
          },
          {
            path: "shell-demo",
            element: <ShellDemoPage />
          }
        ]
      },
      // Catch-all 404 Route
      {
        path: "*",
        element: <PublicLayout />,
        children: [
          {
            path: "*",
            element: <NotFoundPage />
          }
        ]
      }
    ]
  }
]);
