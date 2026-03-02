import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { Toaster } from "@/components/ui/toaster";
import { VersionChecker } from "@/components/VersionChecker";
import { Loader2 } from "lucide-react";

type AuthState = "loading" | "unauthenticated" | "authenticated";

function AuthenticatedApp() {
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    apiRequest("GET", "/api/auth/user")
      .then(() => setAuthState("authenticated"))
      .catch(() => setAuthState("unauthenticated"));
  }, []);

  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return <LoginPage onLogin={() => setAuthState("authenticated")} />;
  }

  return <DashboardPage onLogout={() => setAuthState("unauthenticated")} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthenticatedApp />
      <Toaster />
      <VersionChecker />
    </QueryClientProvider>
  );
}
