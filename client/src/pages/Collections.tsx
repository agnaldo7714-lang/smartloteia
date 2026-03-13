import { AlertCircle, Search, Filter, Phone, MessageCircle, FileText, Send, Calendar, ArrowRight, CheckCircle2, Clock } from "lucide-react";
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

const collectionsData = [
  { id: '1', client: 'Roberto Ferreira', project: 'Bosque das Águas - Q.A L.02', delay: 15, value: 'R$ 1.500,00', status: 'Régua 1 - WhatsApp', risk: 'Baixo', lastContact: 'Ontem' },
  { id: '2', client: 'Amanda Nogueira', project: 'Jardins do Sul - Q.C L.12', delay: 45, value: 'R$ 3.120,00', status: 'Régua 2 - Ligação', risk: 'Médio', lastContact: 'Há 3 dias' },
  { id: '3', client: 'Carlos Magno', project: 'Bosque das Águas - Q.B L.10', delay: 92, value: 'R$ 4.800,00', status: 'Régua 4 - Extrajudicial', risk: 'Alto', lastContact: 'Há 15 dias' },
  { id: '4', client: 'Fernanda Lima', project: 'Jardins do Sul - Q.D L.05', delay: 5, value: 'R$ 1.250,00', status: 'Lembrete Amigável', risk: 'Baixo', lastContact: 'Hoje' },
];

const ReguaStep = ({ active, title, days }: { active: boolean, title: string, days: string }) => (
  <div className={`flex flex-col items-center gap-2 ${active ? 'opacity-100' : 'opacity-40 grayscale'}`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md ${active ? 'bg-emerald-500' : 'bg-slate-400'}`}>
      {active ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
    </div>
    <div className="text-center">
      <p className="text-xs font-bold text-slate-800">{title}</p>
      <p className="text-[10px] text-slate-500">{days}</p>
    </div>
  </div>
);

export default function Collections() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            CRM de Cobrança 
            <Badge variant="secondary" className="bg-red-100 text-red-700 border-0 uppercase tracking-widest text-[10px]">Inadimplência Automática</Badge>
          </h1>
          <p className="text-slate-500">Gestão de réguas de cobrança e recuperação de crédito integrada com WhatsApp.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-white text-slate-700 border-slate-300">
            <FileText className="h-4 w-4" /> Gerar Acordos
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
            <Send className="h-4 w-4" /> Disparo Lote
          </Button>
        </div>
      </div>

      {/* Régua de Cobrança Visualization */}
      <Card className="shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Fluxo da Régua de Cobrança
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between max-w-4xl mx-auto relative">
            <div className="absolute top-5 left-8 right-8 h-1 bg-slate-200 -z-10 rounded-full">
              <div className="h-full bg-emerald-500 w-1/3 rounded-full"></div>
            </div>
            
            <ReguaStep active={true} title="Lembrete" days="-3 dias (Zap)" />
            <ReguaStep active={true} title="Vencimento" days="Dia 0" />
            <ReguaStep active={true} title="Aviso 1" days="+5 dias (Zap)" />
            <ReguaStep active={false} title="Ligação" days="+15 dias" />
            <ReguaStep active={false} title="Notificação" days="+30 dias (Carta)" />
            <ReguaStep active={false} title="Extrajudicial" days="+90 dias" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Inadimplência Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-2">
              <div className="text-3xl font-black text-slate-800">4.2%</div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 w-[4.2%] rounded-full"></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Atraso Crítico (&gt;30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-700">R$ 84.500</div>
            <p className="text-xs font-semibold text-red-600/80 mt-1">12 contratos nesta situação</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-emerald-700">Recuperado (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-700">R$ 22.300</div>
            <p className="text-xs font-semibold text-emerald-600/80 mt-1">Acordos fechados</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-blue-700">Ações Automáticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-800">145</div>
            <p className="text-xs font-semibold text-blue-600/80 mt-1">WhatsApp enviados hoje</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200 bg-white">
        <CardHeader className="p-4 border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Buscar por CPF, Cliente ou Lote..." className="pl-9 bg-slate-50 border-slate-200 font-medium" />
              </div>
              <Button variant="outline" size="icon" className="border-slate-200 text-slate-600">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
               <Badge variant="outline" className="cursor-pointer bg-slate-100 border-slate-200 text-slate-700 font-bold hover:bg-slate-200 px-3 py-1">Todos (24)</Badge>
               <Badge className="cursor-pointer bg-red-100 text-red-700 hover:bg-red-200 border-0 font-bold px-3 py-1">Risco Alto (4)</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-600 font-bold h-12">Cliente / Contrato</TableHead>
                <TableHead className="text-slate-600 font-bold h-12">Atraso</TableHead>
                <TableHead className="text-slate-600 font-bold h-12">Valor Devido</TableHead>
                <TableHead className="text-slate-600 font-bold h-12">Status na Régua</TableHead>
                <TableHead className="text-slate-600 font-bold h-12">Último Contato</TableHead>
                <TableHead className="text-right text-slate-600 font-bold h-12">Ações Rápidas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collectionsData.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50 border-slate-100 group transition-colors">
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{item.client}</span>
                      <span className="text-xs font-medium text-slate-500 mt-0.5">{item.project}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-bold ${
                        item.delay > 60 ? 'bg-red-100 text-red-700' : 
                        item.delay > 30 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.delay} dias
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-slate-700">{item.value}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-white border-slate-300 text-slate-700 font-bold shadow-sm">
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.lastContact}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" className="h-8 bg-[#25D366] hover:bg-[#128C7E] text-white shadow-sm gap-1.5 font-bold">
                        <MessageCircle className="w-3.5 h-3.5" /> Zap
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5 font-bold">
                        <Phone className="w-3.5 h-3.5" /> Ligar
                      </Button>
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