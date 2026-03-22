import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import type { SafeUser, UserRole } from "@shared/schema";
import {
  Building2,
  LayoutDashboard,
  Users,
  Map,
  FileText,
  CircleDollarSign,
  Bell,
  Search,
  Menu,
  LogOut,
  Settings,
  KanbanSquare,
  MessageSquare,
  Calculator,
  ShieldCheck,
  BriefcaseBusiness,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
};

const navigation: NavigationItem[] = [
  {
    name: "Painel Executivo",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "manager", "financial"],
  },
  {
    name: "CRM e Funil",
    href: "/crm",
    icon: KanbanSquare,
    roles: ["admin", "manager", "broker"],
  },
  {
    name: "Pré-atendimentos",
    href: "/pre-atendimentos",
    icon: ClipboardList,
    roles: ["admin", "manager", "broker"],
  },
  {
    name: "Clientes",
    href: "/clientes",
    icon: Users,
    roles: ["admin", "manager", "broker"],
  },
  {
    name: "Corretores",
    href: "/corretores",
    icon: BriefcaseBusiness,
    roles: ["admin", "manager"],
  },
  {
    name: "Mapa de Lotes",
    href: "/lotes",
    icon: Map,
    roles: ["admin", "manager", "broker"],
  },
  {
    name: "Simulador",
    href: "/simulador",
    icon: Calculator,
    roles: ["admin", "manager", "broker"],
  },
  {
    name: "Vendas e Contratos",
    href: "/vendas",
    icon: FileText,
    roles: ["admin", "manager", "broker", "financial"],
  },
  {
    name: "Financeiro e Cobranças",
    href: "/financeiro",
    icon: CircleDollarSign,
    roles: ["admin", "manager", "financial"],
  },
  {
    name: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    roles: ["admin" ],
  },
];

function getRoleLabel(role: SafeUser["role"]) {
  switch (role) {
    case "admin":
      return "Administrador";
    case "manager":
      return "Gestor do Empreendimento";
    case "financial":
      return "Financeiro";
    default:
      return "Corretor";
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function SidebarContent({
  location,
  user,
  onLogout,
}: {
  location: string;
  user: SafeUser;
  onLogout: () => void;
}) {
  const visibleNavigation = navigation.filter((item) =>
    item.roles.includes(user.role),
  );

  return (
    <>
      <div className="h-16 flex items-center px-6 border-b border-slate-800/50 bg-[#0B1121]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mr-3 shadow-lg shadow-emerald-500/20">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-black text-xl tracking-tight text-white block leading-none">
            SmartloteIA
          </span>
          <span className="text-[11px] text-emerald-400 font-medium">
            Operação comercial inteligente
          </span>
        </div>
      </div>

      <div className="px-4 py-4 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
          Operação
        </p>

        <nav className="space-y-1">
          {visibleNavigation.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));

            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner"
                      : "hover:bg-slate-800/50 hover:text-white border border-transparent"
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive ? "text-emerald-400" : "text-slate-400"
                    }`}
                  />
                  {item.name}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-800 bg-[#0B1121]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-slate-700">
              <AvatarFallback className="bg-emerald-500/15 text-emerald-300 font-bold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-bold text-white truncate">
                {user.name}
              </span>
              <span className="text-xs text-emerald-400 font-medium truncate">
                {getRoleLabel(user.role)}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-red-500/20"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Layout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SafeUser;
}) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const canAccessSettings = useMemo(
    () => ["admin"].includes(user.role),
    [user.role],
  );

  async function handleLogout() {
    try {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.setQueryData(["/api/auth/me"], null);
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/login");
    } catch {
      toast({
        title: "Falha ao sair",
        description: "Não foi possível encerrar a sessão agora.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 z-50 bg-[#0f172a] text-slate-300 border-r border-slate-800 shadow-xl">
        <SidebarContent location={location} user={user} onLogout={handleLogout} />
      </aside>

      <main className="flex-1 md:pl-72 flex flex-col min-h-screen transition-all">
        <header className="h-16 bg-white/85 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center flex-1 gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden mr-1">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className="p-0 w-[290px] bg-[#0f172a] text-slate-300 border-slate-800"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu SmartloteIA</SheetTitle>
                  <SheetDescription>Navegação principal do sistema.</SheetDescription>
                </SheetHeader>

                <SidebarContent
                  location={location}
                  user={user}
                  onLogout={handleLogout}
                />
              </SheetContent>
            </Sheet>

            <div className="w-full max-w-xl hidden sm:flex items-center relative group">
              <Search className="h-4 w-4 absolute left-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="search"
                placeholder="Busca global: clientes, lotes, contratos, parcelas..."
                className="w-full pl-9 bg-muted/50 border-transparent focus-visible:ring-emerald-500 focus-visible:bg-white transition-all rounded-full shadow-inner"
              />
              <div className="absolute right-2 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-slate-200 shadow-sm">
                Ctrl K
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Sessão protegida
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-colors"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-white"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border border-slate-200">
                    <AvatarFallback className="bg-slate-900 text-white font-bold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-bold">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                    <span className="text-xs text-emerald-700 font-semibold mt-1">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {canAccessSettings ? (
                  <DropdownMenuItem onClick={() => setLocation("/configuracoes")}>
                    <Settings className="mr-2 h-4 w-4" /> Configurações do Sistema
                  </DropdownMenuItem>
                ) : null}

                <DropdownMenuItem
                  className="text-destructive font-semibold"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sair da Plataforma
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto relative bg-[#f8fafc]">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-slate-100 to-transparent pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}