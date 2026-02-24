import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, Users, Shield, Target, TrendingUp, Sparkles } from "lucide-react";
import { useEffect } from "react";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex items-center gap-2 text-primary">
          <Heart className="h-8 w-8 fill-primary" />
          <span className="text-2xl font-heading font-bold">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Heart className="h-6 w-6 fill-primary text-primary" />
            </div>
            <span className="font-heading font-bold text-2xl tracking-tight text-foreground">SyncCycle</span>
          </div>
          <Button asChild size="lg" className="shadow-lg shadow-primary/20">
            <a href="/api/login" data-testid="button-login">Sign In</a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Wellness & Productivity for Couples
            </div>
            <h1 className="text-5xl lg:text-6xl font-heading font-bold leading-tight text-foreground">
              Stay <span className="text-primary">synced</span> with the one you love
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              SyncCycle helps couples navigate emotional wellness together, with tools designed for understanding, support, and shared growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-lg px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                <a href="/api/login" data-testid="button-get-started">Get Started Free</a>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8" disabled>
                Learn More
              </Button>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Free forever plan
              </span>
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                No credit card required
              </span>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
            <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-8 border border-primary/20">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-white/80 rounded-xl shadow-sm">
                  <div className="h-4 w-4 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">Your Partner</p>
                    <p className="text-sm">Feeling stable and connected</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/80 rounded-xl shadow-sm">
                    <Target className="h-5 w-5 text-primary mb-2" />
                    <p className="text-sm font-medium">3 Shared Goals</p>
                    <p className="text-xs text-muted-foreground">45% avg progress</p>
                  </div>
                  <div className="p-4 bg-white/80 rounded-xl shadow-sm">
                    <TrendingUp className="h-5 w-5 text-chart-2 mb-2" />
                    <p className="text-sm font-medium">Wellness Score</p>
                    <p className="text-xs text-muted-foreground">7.2/10 this week</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold mb-4">Built for couples who care</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Whether navigating mental health challenges or simply wanting to grow together, SyncCycle provides the tools you need.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-background border border-border/50 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-3">Signal System</h3>
              <p className="text-muted-foreground">
                Share your emotional state in real-time with simple green/yellow/red signals. Your partner always knows how to best support you.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-background border border-border/50 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-3">Crisis Planning</h3>
              <p className="text-muted-foreground">
                Create pre-agreed action plans for difficult moments. When emotions run high, clear steps help both partners respond with care.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-background border border-border/50 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-chart-2/20 flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-chart-2" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-3">Shared Goals</h3>
              <p className="text-muted-foreground">
                Track wellness, finances, and relationship goals together. Celebrate wins and stay accountable as a team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="h-5 w-5 fill-current" />
            <span className="font-heading font-medium">SyncCycle</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SyncCycle. Built with care for couples.
          </p>
        </div>
      </footer>
    </div>
  );
}
