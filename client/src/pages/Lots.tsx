import { useState } from "react";
import { Search, Filter, Maximize2, MapPin, CheckCircle2, Home, Info, Droplets, Zap, Wifi, Plus, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Generate sophisticated map data
const generateLots = () => {
  const lots = [];
  const blocks = ['A', 'B', 'C', 'D'];
  for (let b = 0; b < blocks.length; b++) {
    for (let i = 1; i <= 8; i++) {
      const status = Math.random() > 0.65 ? 'Vendido' : Math.random() > 0.85 ? 'Reservado' : 'Disponível';
      lots.push({
        id: `${blocks[b]}-${i}`,
        block: blocks[b],
        lot: i.toString().padStart(2, '0'),
        area: Math.floor(Math.random() * 150 + 250), // 250 to 400 m2
        front: (Math.random() * 5 + 10).toFixed(1),
        price: (Math.random() * 100 + 150).toFixed(3),
        status: status,
      });
    }
  }
  return lots;
};

const mapLotsData = generateLots();

const getStatusColor = (status: string) => {
  switch(status) {
    case 'Disponível': return 'bg-emerald-500 border-emerald-600 hover:bg-emerald-400';
    case 'Vendido': return 'bg-slate-300 border-slate-400 text-slate-500 opacity-60 cursor-not-allowed';
    case 'Reservado': return 'bg-amber-400 border-amber-500 hover:bg-amber-300';
    default: return 'bg-slate-200 border-slate-300';
  }
};

export default function Lots() {
  const [zoom, setZoom] = useState(1);
  const [selectedMap, setSelectedMap] = useState("bosque");
  const [lotsData, setLotsData] = useState(mapLotsData);
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const { toast } = useToast();

  const handleAction = (msg: string) => {
    toast({
      title: "Sucesso!",
      description: msg,
      variant: "default",
    });
  };

  const handleMapChange = (val: string) => {
    setSelectedMap(val);
    // Regenerate data to simulate different map
    setLotsData(generateLots());
    toast({
      title: "Mapa Alterado",
      description: `Visualizando ${val === 'bosque' ? 'Residencial Bosque das Águas' : 'Jardins do Sul'}`,
    });
  };

  const openEditLot = (lot: any) => {
    setSelectedLot({...lot});
    setIsEditDialogOpen(true);
  };

  const handleSaveLot = () => {
    if (!selectedLot) return;
    setLotsData(lotsData.map(l => l.id === selectedLot.id ? selectedLot : l));
    setIsEditDialogOpen(false);
    toast({
      title: "Lote Atualizado",
      description: `As informações do lote ${selectedLot.block}-${selectedLot.lot} foram salvas.`,
    });
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mapa Digital de Loteamentos</h1>
          <p className="text-slate-500">Espelho de vendas interativo com disponibilidade em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMap} onValueChange={handleMapChange}>
            <SelectTrigger className="w-[240px] bg-white border-slate-300 font-medium">
              <SelectValue placeholder="Selecione o Empreendimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bosque">Residencial Bosque das Águas</SelectItem>
              <SelectItem value="jardins">Jardins do Sul</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="flex-1 shadow-md border-slate-200 bg-slate-50 overflow-hidden flex flex-col">
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center z-10 shrink-0 shadow-sm">
          
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md">
              <div className="w-3 h-3 rounded-sm bg-emerald-500 shadow-sm"></div>
              <span className="text-sm font-semibold text-slate-700">Disponível ({lotsData.filter(l => l.status === 'Disponível').length})</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md">
              <div className="w-3 h-3 rounded-sm bg-amber-400 shadow-sm"></div>
              <span className="text-sm font-semibold text-slate-700">Reservado ({lotsData.filter(l => l.status === 'Reservado').length})</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md">
              <div className="w-3 h-3 rounded-sm bg-slate-300 shadow-sm"></div>
              <span className="text-sm font-semibold text-slate-700">Vendido ({lotsData.filter(l => l.status === 'Vendido').length})</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar Lote (ex: A-01)" className="pl-9 h-9 w-48 bg-white border-slate-300" />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-2 text-slate-600">
              <Filter className="w-4 h-4" /> Filtros
            </Button>
          </div>
        </div>

        <CardContent className="p-0 flex-1 relative overflow-auto bg-[#e5e7eb] flex items-center justify-center min-h-[600px] pattern-grid">
          
          {/* Map Controls */}
          <div className="absolute top-6 right-6 flex flex-col gap-2 z-20 bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg border border-slate-200">
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(z + 0.2, 2))} className="h-8 w-8 hover:bg-slate-200"><Plus className="w-4 h-4"/></Button>
            <div className="h-px w-full bg-slate-200"></div>
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="h-8 w-8 hover:bg-slate-200"><div className="w-4 h-0.5 bg-slate-700"></div></Button>
            <div className="h-px w-full bg-slate-200"></div>
            <Button variant="ghost" size="icon" onClick={() => setZoom(1)} className="h-8 w-8 hover:bg-slate-200"><Maximize2 className="w-4 h-4"/></Button>
          </div>

          {/* Infrastructure Legend */}
          <div className="absolute bottom-6 left-6 flex gap-3 z-20 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg border border-slate-200">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Infraestrutura do Empreendimento</p>
              <div className="flex gap-4 mt-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700"><Droplets className="w-4 h-4 text-blue-500"/> Água</div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700"><Zap className="w-4 h-4 text-amber-500"/> Energia</div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700"><MapPin className="w-4 h-4 text-slate-500"/> Asfalto</div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700"><Wifi className="w-4 h-4 text-emerald-500"/> Fibra Óptica</div>
              </div>
            </div>
          </div>

          {/* The Map Concept */}
          <div 
            className="relative transition-transform duration-300 origin-center" 
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Street Layout Concept */}
            <div className="bg-slate-800 rounded-[40px] p-6 shadow-2xl relative">
              <div className="absolute top-1/2 left-0 w-full h-16 bg-slate-700 -translate-y-1/2 flex items-center justify-center">
                <div className="w-full h-1 border-t-2 border-dashed border-yellow-500/50"></div>
              </div>
              <div className="absolute left-1/2 top-0 h-full w-16 bg-slate-700 -translate-x-1/2 flex items-center justify-center">
                <div className="h-full w-1 border-l-2 border-dashed border-yellow-500/50"></div>
              </div>

              <div className="grid grid-cols-2 gap-24 relative z-10">
                {['A', 'B', 'C', 'D'].map(block => (
                  <div key={block} className="bg-[#8bc34a] p-4 rounded-xl shadow-inner border-4 border-[#7cb342] relative">
                    <div className="absolute -top-4 -left-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-slate-200 z-20">
                      <span className="font-black text-slate-800 text-lg">{block}</span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-1">
                      {lotsData.filter(l => l.block === block).map(lot => (
                        <Tooltip key={lot.id} delayDuration={100}>
                          <TooltipTrigger asChild>
                            <div 
                              className={`
                                h-20 w-16 rounded-[4px] border-2 transition-all duration-200 shadow-sm
                                flex flex-col items-center justify-center
                                ${getStatusColor(lot.status)}
                                ${lot.status !== 'Vendido' ? 'hover:-translate-y-1 hover:shadow-lg cursor-pointer' : ''}
                              `}
                            >
                              <span className="text-xs font-black text-white/90 drop-shadow-md">{lot.lot}</span>
                              {lot.status === 'Disponível' && <span className="text-[8px] font-bold text-white/80 mt-1">{lot.area}m²</span>}
                              {lot.status === 'Reservado' && <CheckCircle2 className="w-4 h-4 text-white/80 mt-1" />}
                              {lot.status === 'Vendido' && <Home className="w-4 h-4 text-slate-600/50 mt-1" />}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="p-0 border-0 shadow-xl overflow-hidden rounded-xl">
                            <div className="bg-slate-900 text-white px-4 py-3 min-w-[200px]">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Quadra {lot.block}</p>
                                  <p className="text-lg font-bold">Lote {lot.lot}</p>
                                </div>
                                <Badge className={
                                  lot.status === 'Disponível' ? 'bg-emerald-500' : 
                                  lot.status === 'Reservado' ? 'bg-amber-500 text-slate-900' : 'bg-slate-600'
                                }>{lot.status}</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                                <div className="bg-slate-800 p-2 rounded-lg">
                                  <span className="block text-[10px] text-slate-400">Área Total</span>
                                  <span className="font-bold">{lot.area} m²</span>
                                </div>
                                <div className="bg-slate-800 p-2 rounded-lg">
                                  <span className="block text-[10px] text-slate-400">Frente</span>
                                  <span className="font-bold">{lot.front} m</span>
                                </div>
                              </div>
                              {lot.status === 'Disponível' && (
                                <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between items-center">
                                  <span className="text-xs text-slate-400">Valor à vista</span>
                                  <span className="font-bold text-emerald-400 text-base">R$ {lot.price}</span>
                                </div>
                              )}
                            </div>
                            {lot.status === 'Disponível' && (
                              <div className="bg-slate-100 p-2 flex gap-2">
                                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs" onClick={() => handleAction('Redirecionando para o simulador...')}>Simular</Button>
                                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => handleAction(`Lote ${lot.block}-${lot.lot} reservado com sucesso!`)}>Reservar</Button>
                              </div>
                            )}
                            <div className="bg-slate-200 p-2 border-t border-slate-300">
                              <Button size="sm" variant="ghost" className="w-full text-xs h-7 text-slate-600 hover:text-slate-900" onClick={() => openEditLot(lot)}>
                                <Edit2 className="w-3 h-3 mr-2" /> Editar Lote
                              </Button>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Lote {selectedLot?.block}-{selectedLot?.lot}</DialogTitle>
            <DialogDescription>
              Ajuste as características e disponibilidade deste lote.
            </DialogDescription>
          </DialogHeader>
          {selectedLot && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={selectedLot.status} onValueChange={v => setSelectedLot({...selectedLot, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Reservado">Reservado</SelectItem>
                    <SelectItem value="Vendido">Vendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Área (m²)</Label>
                  <Input type="number" value={selectedLot.area} onChange={e => setSelectedLot({...selectedLot, area: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Frente (m)</Label>
                  <Input type="number" value={selectedLot.front} onChange={e => setSelectedLot({...selectedLot, front: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor Base (R$)</Label>
                <Input value={selectedLot.price} onChange={e => setSelectedLot({...selectedLot, price: e.target.value})} />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveLot}>Salvar Lote</Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        .pattern-grid {
          background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
          background-size: 32px 32px;
        }
      `}</style>
    </div>
  );
}