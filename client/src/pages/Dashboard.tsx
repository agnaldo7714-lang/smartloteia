import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  MapPin, 
  FileCheck2,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
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
  { id: '1', client: 'João Silva', lot: 'Quadra A - Lote 12', value: 'R$ 150.000', status: 'Aprovado', date: 'Hoje' },
  { id: '2', client: 'Maria Santos', lot: 'Quadra B - Lote 05', value: 'R$ 185.000', status: 'Em Análise', date: 'Ontem' },
  { id: '3', client: 'Carlos Oliveira', lot: 'Quadra C - Lote 22', value: 'R$ 120.000', status: 'Aprovado', date: '12/03' },
  { id: '4', client: 'Ana Costa', lot: 'Quadra A - Lote 08', value: 'R$ 160.000', status: 'Pendente', date: '10/03' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground">Acompanhe os resultados de vendas e desempenho do mês.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas no Mês
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-md">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 1.250.000</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 text-accent mr-1" />
              <span className="text-accent font-medium">+15%</span> em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Novos Clientes
            </CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-md">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+42</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 text-accent mr-1" />
              <span className="text-accent font-medium">+5%</span> novos cadastros
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lotes Disponíveis
            </CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-md">
              <MapPin className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">148</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <ArrowDownRight className="h-3 w-3 text-destructive mr-1" />
              <span className="text-destructive font-medium">-12</span> lotes vendidos
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Propostas Ativas
            </CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-md">
              <FileCheck2 className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground mt-1">
              R$ 2.400.000 em negociação
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="col-span-1 lg:col-span-2 glass-panel">
          <CardHeader>
            <CardTitle>Evolução de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => `R$ ${value / 1000}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Vendas']}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-1 glass-panel">
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium leading-none">{sale.client}</span>
                    <span className="text-xs text-muted-foreground">{sale.lot}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold">{sale.value}</span>
                    <Badge variant={
                      sale.status === 'Aprovado' ? 'default' : 
                      sale.status === 'Em Análise' ? 'secondary' : 'outline'
                    } className={`text-[10px] px-1.5 py-0 ${sale.status === 'Aprovado' ? 'bg-accent hover:bg-accent/90' : ''}`}>
                      {sale.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}