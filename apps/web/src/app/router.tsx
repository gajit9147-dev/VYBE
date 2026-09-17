import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/layouts/AppShell";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { AppHomePage } from "@/pages/AppHomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ErrorPage } from "@/pages/ErrorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <LandingPage />
      },
      {
        path: "auth/login",
        element: <LoginPage />
      },
      {
        path: "auth/register",
        element: <RegisterPage />
      },
      {
        path: "app",
        element: <AppHomePage />
      },
      {
        path: "*",
        element: <NotFoundPage />
      }
    ]
  }
]);
