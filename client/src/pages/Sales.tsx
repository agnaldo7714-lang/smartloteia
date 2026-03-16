import { useState } from "react";
import { Plus, Search, Filter, Download, FileSignature, CheckCircle2, XCircle, Clock } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const initialSalesData = [
  { id: 'VND-001', client: 'João Silva', project: 'Bosque das Águas', unit: 'Q.A L.02', value: '180.000', date: '12/03/2026', broker: 'Carlos', status: 'Assinado', payment: 'Financiado' },
  { id: 'VND-002', client: 'Maria Santos', project: 'Jardins do Sul', unit: 'Q.C L.12', value: '125.000', date: '10/03/2026', broker: 'Ana', status: 'Aguardando Ass.', payment: 'À Vista' },
  { id: 'VND-003', client: 'Empresa XYZ', project: 'Bosque das Águas', unit: 'Q.B L.10', value: '250.000', date: '05/03/2026', broker: 'Direto', status: 'Assinado', payment: 'Financiado' },
  { id: 'VND-004', client: 'Pedro Alves', project: 'Jardins do Sul', unit: 'Q.D L.05', value: '150.000', date: '28/02/2026', broker: 'Carlos', status: 'Cancelado', payment: 'Financiado' },
];

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'Assinado') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === 'Cancelado') return <XCircle className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-amber-500" />;
};

export default function Sales() {
  const [sales, setSales] = useState(initialSalesData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSale, setNewSale] = useState({ client: '', project: '', value: '' });

  const handleCreateSale = () => {
    if (!newSale.client || !newSale.project) return;
    
    const saleToAdd = {
      id: `VND-00${sales.length + 1}`,
      client: newSale.client,
      project: newSale.project,
      unit: 'Q.X L.XX', // mock
      value: newSale.value || '100.000',
      date: new Date().toLocaleDateString('pt-BR'),
      broker: 'Corretor Atual',
      status: 'Aguardando Ass.',
      payment: 'Financiado'
    };
    
    setSales([saleToAdd, ...sales]);
    setNewSale({ client: '', project: '', value: '' });
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Contratos & Vendas</h1>
          <p className="text-slate-500">Gestão de vendas fechadas e assinaturas eletrônicas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-white text-slate-700">
            <Download className="h-4 w-4" /> Exportar Relatório
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                <FileSignature className="h-4 w-4" /> Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Registrar Nova Venda</DialogTitle>
                <DialogDescription>
                  Preencha os dados do cliente e contrato para gerar uma nova venda.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nome do Cliente</Label>
                  <Input placeholder="Ex: João da Silva" value={newSale.client} onChange={e => setNewSale({...newSale, client: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Empreendimento</Label>
                  <Input placeholder="Ex: Bosque das Águas" value={newSale.project} onChange={e => setNewSale({...newSale, project: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Valor da Venda (R$)</Label>
                  <Input placeholder="150.000" value={newSale.value} onChange={e => setNewSale({...newSale, value: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreateSale}>Salvar Venda</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Vendas no Mês</p>
              <p className="text-2xl font-black text-slate-800">18 <span className="text-sm font-medium text-slate-500">contratos</span></p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Aguardando Assinatura</p>
              <p className="text-2xl font-black text-amber-600">5 <span className="text-sm font-medium text-slate-500">contratos</span></p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <FileSignature className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">VGV Total</p>
              <p className="text-2xl font-black text-blue-700">R$ 2.4M</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Download className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200 bg-white">
        <CardHeader className="p-4 border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar por código, cliente ou lote..." className="pl-9 bg-slate-50 border-slate-200" />
            </div>
            <Button variant="outline" className="gap-2 bg-white text-slate-700">
              <Filter className="h-4 w-4" /> Filtros Avançados
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-slate-200">
                <TableHead className="font-bold text-slate-600">Contrato</TableHead>
                <TableHead className="font-bold text-slate-600">Cliente</TableHead>
                <TableHead className="font-bold text-slate-600">Empreendimento</TableHead>
                <TableHead className="font-bold text-slate-600">Valor / Pgto</TableHead>
                <TableHead className="hidden lg:table-cell font-bold text-slate-600">Corretor</TableHead>
                <TableHead className="hidden md:table-cell font-bold text-slate-600">Data</TableHead>
                <TableHead className="font-bold text-slate-600">Status Digital</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                  <TableCell className="font-bold text-slate-800">{sale.id}</TableCell>
                  <TableCell className="font-bold text-slate-700">{sale.client}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700">{sale.project}</span>
                      <span className="text-xs font-medium text-slate-500">{sale.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-emerald-700">R$ {sale.value}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{sale.payment}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm font-semibold text-slate-600">{sale.broker}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm font-medium text-slate-500">{sale.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`font-bold border-0 flex items-center gap-1.5 pl-1.5 pr-3 py-1 ${
                        sale.status === 'Assinado' ? 'bg-emerald-100 text-emerald-800' : 
                        sale.status === 'Cancelado' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        <StatusIcon status={sale.status} />
                        {sale.status}
                      </Badge>
                    </div>
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