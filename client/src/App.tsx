import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Lots from "@/pages/Lots";
import Sales from "@/pages/Sales";
import Financial from "@/pages/Financial";
import CRM from "@/pages/CRM";
import Collections from "@/pages/Collections";
import Simulator from "@/pages/Simulator";
import Settings from "@/pages/Settings";
import Layout from "@/components/layout/Layout";

function Router() {
  const [location] = useLocation();

  if (location === "/login" || location === "/") {
    return <Login />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/dashboard" component={Dashboard}/>
        <Route path="/crm" component={CRM}/>
        <Route path="/clientes" component={Clients}/>
        <Route path="/lotes" component={Lots}/>
        <Route path="/simulador" component={Simulator}/>
        <Route path="/vendas" component={Sales}/>
        <Route path="/financeiro" component={Financial}/>
        <Route path="/cobrancas" component={Collections}/>
        <Route path="/configuracoes" component={Settings}/>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
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