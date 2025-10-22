import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, MessageSquare, List, Settings, Bot, Users } from "lucide-react";

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/chat", icon: MessageSquare, label: "Chat" },
    { to: "/tickets", icon: List, label: "Tickets" },
    { to: "/agents", icon: Users, label: "Agentes Ativos" },
    { to: "/settings", icon: Settings, label: "Configurações" },
  ];

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border h-screen flex flex-col sticky top-0">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold">SupportAI</h1>
            <p className="text-xs text-sidebar-foreground/70">Sistema de Atendimento</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">AD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Admin</p>
            <p className="text-xs text-sidebar-foreground/70 truncate">admin@support.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
