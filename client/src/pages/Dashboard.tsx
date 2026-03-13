import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  MapPin, 
  FileCheck2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Wallet,
  Smartphone
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

const salesData = [
  { name: 'Jan', total: 400000 },
  { name: 'Fev', total: 300000 },
  { name: 'Mar', total: 200000 },
  { name: 'Abr', total: 278000 },
  { name: 'Mai', total: 189000 },
  { name: 'Jun', total: 239000 },
  { name: 'Jul', total: 349000 },
];

const recentSales = [
  { id: '1', client: 'João Silva', lot: 'Quadra A - Lote 12', value: 'R$ 150.000', status: 'Aprovado', date: 'Hoje', origin: 'Corretor' },
  { id: '2', client: 'Maria Santos', lot: 'Quadra B - Lote 05', value: 'R$ 185.000', status: 'Em Análise', date: 'Ontem', origin: 'Site' },
  { id: '3', client: 'Carlos Oliveira', lot: 'Quadra C - Lote 22', value: 'R$ 120.000', status: 'Aprovado', date: '12/03', origin: 'Corretor' },
  { id: '4', client: 'Ana Costa', lot: 'Quadra A - Lote 08', value: 'R$ 160.000', status: 'Pendente', date: '10/03', origin: 'WhatsApp' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Visão 360° do Negócio</h1>
          <p className="text-slate-500">Métricas em tempo real de vendas, financeiro e lotes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white">
            <Calendar className="mr-2 h-4 w-4" /> Este Mês
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Gerar Relatório
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 transition-transform hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">
              VGV Vendido
            </CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">R$ 1.250.000</div>
            <p className="text-xs font-medium mt-2 flex items-center bg-emerald-50 text-emerald-700 w-fit px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +15% vs mês ant.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 transition-transform hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">
              Recebimentos Prev.
            </CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Wallet className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">R$ 342.500</div>
            <p className="text-xs font-medium mt-2 flex items-center bg-emerald-50 text-emerald-700 w-fit px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Meta 92% atingida
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-10 transition-transform hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">
              Lotes Disponíveis
            </CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg">
              <MapPin className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">148<span className="text-sm font-normal text-slate-400 ml-1">/ 450</span></div>
            <p className="text-xs font-medium mt-2 flex items-center bg-amber-50 text-amber-700 w-fit px-2 py-0.5 rounded-full">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -12 unidades (30 dias)
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden relative border-t-4 border-t-purple-500">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -z-10 transition-transform hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">
              Leads no Funil
            </CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">42</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-white text-xs border-slate-200 text-slate-600"><Smartphone className="w-3 h-3 mr-1"/> 28 App</Badge>
              <Badge variant="outline" className="bg-white text-xs border-slate-200 text-slate-600">14 Site</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="col-span-1 lg:col-span-2 border-slate-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-slate-800">Desempenho de Vendas Anual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    tickFormatter={(value) => `R$ ${value / 1000}k`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Vendas']}
                  />
                  <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-1 border-slate-200 shadow-sm bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-slate-800 flex justify-between items-center">
              Vendas e Propostas
              <Button variant="link" className="text-emerald-600 px-0">Ver todas</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{sale.client}</span>
                    <span className="text-xs font-medium text-slate-500">{sale.lot}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-sm font-black text-slate-700">{sale.value}</span>
                    <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 font-bold ${
                      sale.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-700' : 
                      sale.status === 'Em Análise' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {sale.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-100">
              <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">Acessar CRM Completo</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}