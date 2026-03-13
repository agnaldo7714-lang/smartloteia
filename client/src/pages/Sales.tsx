import { Plus, Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const salesData = [
  { id: 'VND-001', client: 'João Silva', project: 'Bosque das Águas', unit: 'Q.A L.02', value: '180.000', date: '12/03/2026', broker: 'Carlos', status: 'Fechada' },
  { id: 'VND-002', client: 'Maria Santos', project: 'Jardins do Sul', unit: 'Q.C L.12', value: '125.000', date: '10/03/2026', broker: 'Ana', status: 'Em Análise' },
  { id: 'VND-003', client: 'Empresa XYZ', project: 'Bosque das Águas', unit: 'Q.B L.10', value: '250.000', date: '05/03/2026', broker: 'Direto', status: 'Fechada' },
  { id: 'VND-004', client: 'Pedro Alves', project: 'Jardins do Sul', unit: 'Q.D L.05', value: '150.000', date: '28/02/2026', broker: 'Carlos', status: 'Cancelada' },
];

export default function Sales() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendas & Propostas</h1>
          <p className="text-muted-foreground">Acompanhe negociações e vendas concluídas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Exportar
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nova Proposta
          </Button>
        </div>
      </div>

      <Card className="glass-panel border-0 shadow-sm">
        <CardHeader className="p-4 border-b pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por código, cliente ou lote..." className="pl-9" />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" /> Filtros Avançados
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Empreendimento/Lote</TableHead>
                <TableHead>Valor (R$)</TableHead>
                <TableHead className="hidden lg:table-cell">Corretor</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-muted/30 cursor-pointer">
                  <TableCell className="font-medium text-primary">{sale.id}</TableCell>
                  <TableCell className="font-medium">{sale.client}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm truncate max-w-[150px]" title={sale.project}>{sale.project}</span>
                      <span className="text-xs text-muted-foreground">{sale.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{sale.value}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{sale.broker}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{sale.date}</TableCell>
                  <TableCell>
                    <Badge variant={
                      sale.status === 'Fechada' ? 'default' : 
                      sale.status === 'Em Análise' ? 'secondary' : 'destructive'
                    } className={sale.status === 'Fechada' ? 'bg-accent/10 text-accent hover:bg-accent/20 border-0' : ''}>
                      {sale.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}