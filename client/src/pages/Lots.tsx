import { useState } from "react";
import { Plus, Search, Filter, Map as MapIcon, Grid2X2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const lotsData = [
  { id: '1', project: 'Residencial Bosque das Águas', block: 'A', lot: '01', area: '360', price: '180.000', status: 'Disponível' },
  { id: '2', project: 'Residencial Bosque das Águas', block: 'A', lot: '02', area: '360', price: '180.000', status: 'Vendido' },
  { id: '3', project: 'Residencial Bosque das Águas', block: 'A', lot: '03', area: '420', price: '210.000', status: 'Reservado' },
  { id: '4', project: 'Jardins do Sul', block: 'C', lot: '12', area: '250', price: '125.000', status: 'Disponível' },
  { id: '5', project: 'Jardins do Sul', block: 'C', lot: '14', area: '250', price: '125.000', status: 'Disponível' },
  { id: '6', project: 'Jardins do Sul', block: 'D', lot: '05', area: '300', price: '150.000', status: 'Vendido' },
];

const getStatusColor = (status: string) => {
  switch(status) {
    case 'Disponível': return 'bg-accent text-white border-0';
    case 'Vendido': return 'bg-destructive text-white border-0';
    case 'Reservado': return 'bg-amber-500 text-white border-0';
    default: return '';
  }
};

export default function Lots() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empreendimentos & Lotes</h1>
          <p className="text-muted-foreground">Gestão de mapa de disponibilidade e precificação.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <MapIcon className="h-4 w-4" /> Novo Empreendimento
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Novo Lote
          </Button>
        </div>
      </div>

      <Card className="glass-panel border-0 shadow-sm">
        <CardHeader className="p-4 border-b pb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select defaultValue="todos">
                <SelectTrigger>
                  <SelectValue placeholder="Empreendimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos empreendimentos</SelectItem>
                  <SelectItem value="bosque">Res. Bosque das Águas</SelectItem>
                  <SelectItem value="jardins">Jardins do Sul</SelectItem>
                </SelectContent>
              </Select>
              
              <Select defaultValue="todos">
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="Disponível">Disponível</SelectItem>
                  <SelectItem value="Vendido">Vendido</SelectItem>
                  <SelectItem value="Reservado">Reservado</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar quadra/lote..." className="pl-9" />
              </div>
            </div>
            
            <Tabs defaultValue="grid" className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-2 md:w-auto">
                <TabsTrigger value="grid" className="gap-2">
                  <Grid2X2 className="h-4 w-4" /> Grade
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2">
                  <MapIcon className="h-4 w-4" /> Mapa
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {lotsData.map((lot) => (
              <Card key={lot.id} className="overflow-hidden hover:shadow-md transition-shadow group cursor-pointer border-border/50">
                <div className={`h-2 w-full ${getStatusColor(lot.status)}`} />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={`text-xs ${getStatusColor(lot.status)} bg-opacity-10 text-opacity-100`}>
                      {lot.status}
                    </Badge>
                    <span className="font-bold text-lg">R$ {lot.price}</span>
                  </div>
                  
                  <h3 className="font-bold text-lg mt-2 mb-1">Quadra {lot.block} - Lote {lot.lot}</h3>
                  <p className="text-sm text-muted-foreground truncate" title={lot.project}>
                    {lot.project}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-border/50 flex justify-between text-sm">
                    <span className="text-muted-foreground">Área Total:</span>
                    <span className="font-medium">{lot.area} m²</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}