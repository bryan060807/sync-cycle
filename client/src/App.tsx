import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Goals from "@/pages/goals";
import Finance from "@/pages/finance";
import BPDTracker from "@/pages/bpd-tracker";
import CrisisPlanPage from "@/pages/crisis-plan";
import ValidationStation from "@/pages/validation";
import Gratitude from "@/pages/gratitude";
import Retro from "@/pages/retro";
import Profile from "@/pages/profile";
import Invites from "@/pages/invites";
import PartnerPage from "@/pages/partner";
import UserProfilePage from "@/pages/user-profile";
import { useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({ title: "Please sign in", description: "Redirecting to login...", variant: "default" });
      setTimeout(() => { window.location.href = "/api/login"; }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-lg">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/goals">
        <ProtectedRoute component={Goals} />
      </Route>
      <Route path="/finance">
        <ProtectedRoute component={Finance} />
      </Route>
      <Route path="/bpd-tracker">
        <ProtectedRoute component={BPDTracker} />
      </Route>
      <Route path="/crisis-plan">
        <ProtectedRoute component={CrisisPlanPage} />
      </Route>
      <Route path="/validation">
        <ProtectedRoute component={ValidationStation} />
      </Route>
      <Route path="/gratitude">
        <ProtectedRoute component={Gratitude} />
      </Route>
      <Route path="/retro">
        <ProtectedRoute component={Retro} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/partner">
        <ProtectedRoute component={PartnerPage} />
      </Route>
      <Route path="/invites">
        <ProtectedRoute component={Invites} />
      </Route>
      <Route path="/user/:id" component={UserProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
