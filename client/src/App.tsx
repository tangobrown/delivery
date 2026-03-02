import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { DashboardPage } from "@/pages/DashboardPage";
import { Toaster } from "@/components/ui/toaster";
import { VersionChecker } from "@/components/VersionChecker";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
      <Toaster />
      <VersionChecker />
    </QueryClientProvider>
  );
}
