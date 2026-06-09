import { Link, useLocation } from "wouter";
import { Leaf, Plus, LayoutDashboard, History, Lightbulb, Target, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Log Activity", href: "/track", icon: Plus },
    { name: "History", href: "/history", icon: History },
    { name: "Insights", href: "/insights", icon: Lightbulb },
    { name: "Goals", href: "/goals", icon: Target },
    { name: "Offset", href: "/offsets", icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-card border-b md:border-b-0 md:border-r border-border shrink-0 md:h-screen sticky top-0 flex flex-col z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <Leaf className="w-6 h-6" />
          </div>
          <span className="font-serif text-xl font-medium tracking-tight text-foreground">EcoTrace</span>
        </div>
        
        <nav className="flex-1 px-4 pb-6 space-y-1 overflow-y-auto md:overflow-visible flex flex-row md:flex-col items-start overflow-x-auto md:overflow-x-visible hide-scrollbar">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-auto">
        <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
