import { DollarSign, ArrowUpRight, ArrowDownRight, Download, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const financialData = [
  { id: 'REC-101', ref: 'VND-001 / Entrada', client: 'João Silva', amount: '36.000,00', date: '15/03/2026', type: 'Receita', status: 'A Receber' },
  { id: 'REC-102', ref: 'VND-003 / Parc. 1/60', client: 'Empresa XYZ', amount: '4.150,00', date: '10/03/2026', type: 'Receita', status: 'Recebido' },
  { id: 'COM-050', ref: 'VND-001 / Comissão', client: 'Corretor Carlos', amount: '9.000,00', date: '16/03/2026', type: 'Despesa', status: 'A Pagar' },
  { id: 'REC-103', ref: 'VND-002 / Sinal', client: 'Maria Santos', amount: '10.000,00', date: '12/03/2026', type: 'Receita', status: 'Atrasado' },
];

export default function Financial() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Controle de recebimentos, comissões e fluxo de caixa.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Relatório
          </Button>
          <Button className="gap-2">
            <DollarSign className="h-4 w-4" /> Nova Transação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-panel border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receitas (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">R$ 145.200,00</div>
          </CardContent>
        </Card>
        
        <Card className="glass-panel border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas/Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">R$ 32.400,00</div>
          </CardContent>
        </Card>
        
        <Card className="glass-panel border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Previsto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ 112.800,00</div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel border-0 shadow-sm">
        <CardHeader className="p-4 border-b pb-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <h3 className="font-semibold text-lg flex items-center">
              Lançamentos
            </h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar transação..." className="pl-9" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Cliente/Fornecedor</TableHead>
                <TableHead className="text-right">Valor (R$)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financialData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{item.date}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.id}</span>
                      <span className="text-xs text-muted-foreground">{item.ref}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.client}</TableCell>
                  <TableCell className={`text-right font-bold flex items-center justify-end gap-1 ${
                    item.type === 'Receita' ? 'text-accent' : 'text-destructive'
                  }`}>
                    {item.type === 'Receita' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {item.amount}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      item.status === 'Recebido' ? 'default' : 
                      item.status === 'Atrasado' ? 'destructive' : 'secondary'
                    } className={
                      item.status === 'Recebido' ? 'bg-accent/10 text-accent hover:bg-accent/20 border-0' : 
                      item.status === 'A Pagar' || item.status === 'A Receber' ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-0' : ''
                    }>
                      {item.status}
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