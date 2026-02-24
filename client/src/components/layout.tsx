import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  HeartHandshake, 
  Wallet, 
  Activity, 
  LogOut, 
  Menu,
  Heart,
  ShieldAlert,
  Stars,
  ClipboardCheck,
  MessageSquare,
  Settings,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const NavItem = ({ href, icon: Icon, label, active, onClick, badge }: any) => (
  <Link 
    href={href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
      active 
        ? "bg-primary/10 text-primary hover:bg-primary/15" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}
  >
    <Icon className="h-5 w-5" />
    {label}
    {badge > 0 && (
      <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </Link>
);

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: receivedInvites = [] } = useQuery<any[]>({
    queryKey: ["/api/invites/received"],
    queryFn: () => apiRequest("GET", "/api/invites/received").then(r => r.json()),
  });

  const pendingInviteCount = receivedInvites.length;

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/partner", icon: Users, label: "Partner", badge: pendingInviteCount },
    { href: "/bpd-tracker", icon: Activity, label: "Wellness Tracker" },
    { href: "/crisis-plan", icon: ShieldAlert, label: "Crisis Plan" },
    { href: "/validation", icon: MessageSquare, label: "Community" },
    { href: "/gratitude", icon: Stars, label: "Wins & Gratitude" },
    { href: "/retro", icon: ClipboardCheck, label: "Weekly Retro" },
    { href: "/goals", icon: HeartHandshake, label: "Shared Goals" },
    { href: "/finance", icon: Wallet, label: "Finance" },
    { href: "/profile", icon: Settings, label: "Settings" },
  ];

  const userName = user?.firstName || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userInitial = userName[0]?.toUpperCase() || 'U';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-8 text-primary">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Heart className="h-5 w-5 fill-primary text-primary" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-foreground">SyncCycle</span>
        </div>
        
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavItem 
              key={item.href} 
              {...item} 
              active={location === item.href} 
              onClick={() => setOpen(false)}
            />
          ))}
        </nav>

      </div>

      <div className="mt-auto p-6 border-t border-border bg-sidebar">
        <Link href="/profile" className="flex items-center gap-3 mb-4 px-2 hover:bg-muted/50 p-2 rounded-xl transition-colors">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt={userName} 
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
                {userInitial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="text-user-name">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
        </Link>
        <Button 
          variant="outline" 
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20"
          onClick={() => logout()}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-sidebar-border bg-sidebar sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border flex items-center px-4 z-40">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r border-sidebar-border">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <span className="ml-3 font-heading font-bold text-lg">SyncCycle</span>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:overflow-auto pt-16 md:pt-0">
        <div className="container max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
