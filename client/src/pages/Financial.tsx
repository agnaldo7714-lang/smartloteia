import { DollarSign, ArrowUpRight, ArrowDownRight, Download, Filter, Search, Plus, CreditCard, Landmark, FileText, BarChart3, Receipt } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const financialData = [
  { id: 'REC-101', ref: 'VND-001 / Entrada', client: 'João Silva', amount: '36.000,00', date: '15/03/2026', type: 'Receita', status: 'A Receber', method: 'Boleto' },
  { id: 'REC-102', ref: 'VND-003 / Parc. 1/60', client: 'Empresa XYZ', amount: '4.150,00', date: '10/03/2026', type: 'Receita', status: 'Recebido', method: 'PIX' },
  { id: 'COM-050', ref: 'VND-001 / Comissão', client: 'Corretor Carlos', amount: '9.000,00', date: '16/03/2026', type: 'Despesa', status: 'A Pagar', method: 'Transferência' },
  { id: 'REC-103', ref: 'VND-002 / Sinal', client: 'Maria Santos', amount: '10.000,00', date: '12/03/2026', type: 'Receita', status: 'Atrasado', method: 'Boleto' },
  { id: 'DES-012', ref: 'Serviços de Topografia', client: 'Topografia Master', amount: '12.500,00', date: '20/03/2026', type: 'Despesa', status: 'A Pagar', method: 'Boleto' },
];

export default function Financial() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">ERP Financeiro</h1>
          <p className="text-slate-500">Contas a pagar/receber, emissão de boletos e fluxo de caixa.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="gap-2 bg-white text-slate-700">
            <Receipt className="h-4 w-4" /> Emitir Boletos
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
            <Plus className="h-4 w-4" /> Novo Lançamento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" /> Receitas Previstas (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">R$ 145.200,00</div>
            <p className="text-xs font-medium text-emerald-600 mt-1">68% já recebido</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-red-500" /> Despesas & Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">R$ 32.400,00</div>
            <p className="text-xs font-medium text-slate-500 mt-1">Vencimento próx. 7 dias</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200 bg-white border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Landmark className="w-4 h-4 text-blue-500" /> Saldo em Contas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-700">R$ 1.112.800,00</div>
            <p className="text-xs font-medium text-blue-600/70 mt-1">Conciliado ontem</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" /> Inadimplência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-700">R$ 18.500,00</div>
            <p className="text-xs font-bold text-amber-600/80 mt-1">Atrasados no mês atual</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200 bg-white">
        <CardHeader className="p-4 border-b border-slate-100 pb-4">
          <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
            
            <Tabs defaultValue="todos" className="w-full sm:w-auto">
              <TabsList className="bg-slate-100 p-1">
                <TabsTrigger value="todos" className="font-semibold px-4">Todos</TabsTrigger>
                <TabsTrigger value="receber" className="font-semibold text-emerald-700 data-[state=active]:text-emerald-700 px-4">A Receber</TabsTrigger>
                <TabsTrigger value="pagar" className="font-semibold text-red-700 data-[state=active]:text-red-700 px-4">A Pagar</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2 w-full xl:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Buscar transação, cliente..." className="pl-9 bg-slate-50 border-slate-200" />
              </div>
              <Button variant="outline" className="gap-2 border-slate-200 text-slate-700">
                <Filter className="h-4 w-4" /> Filtros
              </Button>
            </div>

          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-slate-200">
                <TableHead className="font-bold text-slate-600 h-12">Vencimento</TableHead>
                <TableHead className="font-bold text-slate-600 h-12">Descrição / Ref</TableHead>
                <TableHead className="font-bold text-slate-600 h-12">Cliente/Fornecedor</TableHead>
                <TableHead className="font-bold text-slate-600 h-12 hidden md:table-cell">Método</TableHead>
                <TableHead className="text-right font-bold text-slate-600 h-12">Valor (R$)</TableHead>
                <TableHead className="font-bold text-slate-600 h-12">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {financialData.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50 border-slate-100 transition-colors">
                  <TableCell className="font-semibold text-slate-700 whitespace-nowrap">{item.date}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{item.id}</span>
                      <span className="text-xs font-medium text-slate-500">{item.ref}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">{item.client}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                      {item.method}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-black flex items-center justify-end gap-1.5 ${
                    item.type === 'Receita' ? 'text-emerald-600' : 'text-slate-800'
                  }`}>
                    {item.type === 'Receita' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
                    {item.amount}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-bold border-0 px-2.5 py-1 ${
                      item.status === 'Recebido' ? 'bg-emerald-100 text-emerald-800' : 
                      item.status === 'Atrasado' ? 'bg-red-100 text-red-800' : 
                      item.status === 'A Receber' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
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