import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import type { SafeUser, UserRole } from "@shared/schema";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Building2, LoaderCircle } from "lucide-react";

import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import PreAtendimentos from "@/pages/PreAtendimentos";
import Lots from "@/pages/Lots";
import Sales from "@/pages/Sales";
import Financial from "@/pages/Financial";
import CRM from "@/pages/CRM";
import Collections from "@/pages/Collections";
import Simulator from "@/pages/Simulator";
import Settings from "@/pages/Settings";
import Brokers from "@/pages/Brokers";
import Layout from "@/components/layout/Layout";

type RouteDefinition = {
  path: string;
  component: React.ComponentType;
  roles: UserRole[];
};

const routeDefinitions: RouteDefinition[] = [
  {
    path: "/dashboard",
    component: Dashboard,
    roles: ["admin", "manager", "financial"],
  },
  {
    path: "/crm",
    component: CRM,
    roles: ["admin", "manager", "broker"],
  },
  {
    path: "/pre-atendimentos",
    component: PreAtendimentos,
    roles: ["admin", "manager", "broker"],
  },
  {
    path: "/clientes",
    component: Clients,
    roles: ["admin", "manager", "broker"],
  },
  {
    path: "/corretores",
    component: Brokers,
    roles: ["admin", "manager"],
  },
  {
    path: "/lotes",
    component: Lots,
    roles: ["admin", "manager", "broker"],
  },
  {
    path: "/simulador",
    component: Simulator,
    roles: ["admin", "manager", "broker"],
  },
  {
    path: "/vendas",
    component: Sales,
    roles: ["admin", "manager", "broker", "financial"],
  },
  {
    path: "/financeiro",
    component: Financial,
    roles: ["admin", "manager", "financial"],
  },
  {
    path: "/cobrancas",
    component: Collections,
    roles: ["admin", "manager", "financial"],
  },
  {
    path: "/configuracoes",
    component: Settings,
    roles: ["admin"],
  },
];

const publicRoutes = new Set(["/", "/login"]);

function getDefaultPathByRole(role: UserRole) {
  switch (role) {
    case "admin":
      return "/dashboard";
    case "manager":
      return "/dashboard";
    case "broker":
      return "/vendas";
    case "financial":
      return "/financeiro";
    default:
      return "/dashboard";
  }
}

function canAccessPath(role: UserRole, path: string) {
  const matched = routeDefinitions.find(
    (route) => path === route.path || path.startsWith(`${route.path}/`),
  );

  if (!matched) return true;
  return matched.roles.includes(role);
}

function SplashScreen() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
          <Building2 className="h-8 w-8 text-emerald-400" />
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight">SmartloteIA</h1>
          <p className="text-sm text-slate-400">
            Inicializando ambiente comercial
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-emerald-400">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          <span className="text-sm">Validando sessão...</span>
        </div>
      </div>
    </div>
  );
}

function PrivateApp({ user }: { user: SafeUser }) {
  const allowedRoutes = routeDefinitions.filter((route) =>
    route.roles.includes(user.role),
  );

  return (
    <Layout user={user}>
      <Switch>
        {allowedRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            component={route.component}
          />
        ))}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  const [location, setLocation] = useLocation();
  const isPublicRoute = publicRoutes.has(location);

  const { data: currentUser, isLoading } = useQuery<SafeUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  useEffect(() => {
    if (isLoading) return;

    if (!currentUser && !isPublicRoute) {
      setLocation("/login");
      return;
    }

    if (currentUser) {
      const defaultPath = getDefaultPathByRole(currentUser.role);

      if (isPublicRoute) {
        setLocation(defaultPath);
        return;
      }

      if (!canAccessPath(currentUser.role, location)) {
        setLocation(defaultPath);
      }
    }
  }, [currentUser, isLoading, isPublicRoute, location, setLocation]);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!currentUser) {
    return <Login />;
  }

  return <PrivateApp user={currentUser} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;