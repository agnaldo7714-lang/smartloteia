import { Link, useLocation } from "wouter";
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
  AlertTriangle,
  MessageSquare,
  Calculator
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
  { name: 'Visão 360°', href: '/', icon: LayoutDashboard },
  { name: 'CRM & Funil', href: '/crm', icon: KanbanSquare },
  { name: 'Mapa de Lotes', href: '/lotes', icon: Map },
  { name: 'Simulador', href: '/simulador', icon: Calculator },
  { name: 'Contratos & Vendas', href: '/vendas', icon: FileText },
  { name: 'ERP Financeiro', href: '/financeiro', icon: CircleDollarSign },
  { name: 'Cobrança Automática', href: '/cobrancas', icon: AlertTriangle },
  { name: 'Carteira de Clientes', href: '/clientes', icon: Users },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-[#0f172a] text-slate-300 border-r border-slate-800 shadow-xl">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/50 bg-[#0B1121]">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mr-3 shadow-lg shadow-emerald-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Smartlote</span>
        </div>
        
        <div className="px-4 py-4 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Menu Principal</p>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
              return (
                <Link key={item.name} href={item.href}>
                  <a className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner' 
                      : 'hover:bg-slate-800/50 hover:text-white border border-transparent'
                  }`}>
                    <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-800 bg-[#0B1121]">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-slate-700">
              <AvatarImage src="https://i.pravatar.cc/150?u=admin" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Carlos Diretor</span>
              <span className="text-xs text-emerald-400 font-medium">Administrador</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen transition-all">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center flex-1">
            <Button variant="ghost" size="icon" className="md:hidden mr-2">
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="w-full max-w-md hidden sm:flex items-center relative group">
              <Search className="h-4 w-4 absolute left-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type="search" 
                placeholder="Busca global inteligente (lotes, clientes, contratos)..." 
                className="w-full pl-9 bg-muted/50 border-transparent focus-visible:ring-emerald-500 focus-visible:bg-white transition-all rounded-full shadow-inner"
              />
              <div className="absolute right-2 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-slate-200 shadow-sm">⌘K</div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="relative hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-colors">
              <MessageSquare className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
            </Button>

            <Button variant="ghost" size="icon" className="relative hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-white"></span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full md:hidden">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="https://i.pravatar.cc/150?u=admin" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" /> Configurações do Sistema
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive font-semibold">
                  <LogOut className="mr-2 h-4 w-4" /> Sair da Plataforma
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto relative bg-[#f8fafc]">
          {/* Decorative background element */}
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-slate-100 to-transparent pointer-events-none -z-10" />
          
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}