import { useState } from "react";
import { Plus, Search, Filter, Phone, Mail, MessageCircle, MoreHorizontal, CalendarClock, Flame, ThermometerSnowflake, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const kanbanData = {
  leads: [
    { id: '1', name: 'Roberto Almeida', project: 'Bosque das Águas', value: 'R$ 180k', time: '2h atrás', source: 'WhatsApp', temp: 'hot' },
    { id: '2', name: 'Camila Barros', project: 'Jardins do Sul', value: 'R$ 125k', time: '5h atrás', source: 'Instagram', temp: 'warm' },
    { id: '7', name: 'Felipe Santos', project: 'Valle Verde', value: 'R$ 250k', time: '1 dia', source: 'Site', temp: 'cold' },
  ],
  qualification: [
    { id: '3', name: 'Thiago Martins', project: 'Bosque das Águas', value: 'R$ 210k', time: '1 dia', source: 'Indicação', temp: 'warm' },
  ],
  visit: [
    { id: '4', name: 'Família Souza', project: 'Jardins do Sul', value: 'R$ 150k', time: 'Hoje 14h', source: 'WhatsApp', temp: 'hot' },
    { id: '5', name: 'Juliana Costa', project: 'Bosque das Águas', value: 'R$ 180k', time: 'Amanhã', source: 'Facebook', temp: 'hot' },
  ],
  proposal: [
    { id: '6', name: 'Empresa XYZ', project: 'Bosque - Comercial', value: 'R$ 450k', time: 'Em análise', source: 'Site', temp: 'hot' },
  ]
};

const TempIcon = ({ temp }: { temp: string }) => {
  if (temp === 'hot') return <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" />;
  if (temp === 'warm') return <Activity className="w-4 h-4 text-amber-500" />;
  return <ThermometerSnowflake className="w-4 h-4 text-blue-500" />;
};

export default function CRM() {
  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">CRM & Funil de Vendas</h1>
          <p className="text-slate-500">Gestão de leads com integração simulada de WhatsApp.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-white">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20">
            <Plus className="h-4 w-4" /> Novo Lead
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-[1200px] items-start">
          
          {/* Column 1: Leads */}
          <div className="w-[320px] flex flex-col gap-3 h-full">
            <div className="flex items-center justify-between px-2 py-1 border-b-2 border-blue-500">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                Novos Leads
              </h3>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-bold">{kanbanData.leads.length}</Badge>
            </div>
            
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 pb-2">
              {kanbanData.leads.map(lead => (
                <Card key={lead.id} className="cursor-grab hover:border-emerald-400 hover:shadow-lg transition-all border-slate-200 shadow-sm bg-white">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <TempIcon temp={lead.temp} />
                        <Badge variant="outline" className="text-[10px] font-bold text-slate-500 bg-slate-50 uppercase tracking-wider">
                          {lead.source}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-slate-400">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    <h4 className="font-bold text-slate-800 text-base mb-1">{lead.name}</h4>
                    <p className="text-xs font-medium text-slate-500 mb-4">{lead.project}</p>
                    
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-medium uppercase">Interesse</span>
                        <span className="text-sm font-bold text-emerald-600">{lead.value}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-green-200 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition-colors">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Column 2: Qualificação */}
          <div className="w-[320px] flex flex-col gap-3 h-full">
            <div className="flex items-center justify-between px-2 py-1 border-b-2 border-purple-500">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                Em Atendimento
              </h3>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-bold">{kanbanData.qualification.length}</Badge>
            </div>
            
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 pb-2">
              {kanbanData.qualification.map(lead => (
                <Card key={lead.id} className="cursor-grab hover:border-emerald-400 hover:shadow-lg transition-all border-slate-200 shadow-sm bg-white">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <TempIcon temp={lead.temp} />
                        <Badge variant="outline" className="text-[10px] font-bold text-slate-500 bg-slate-50 uppercase tracking-wider">
                          {lead.source}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-slate-400">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    <h4 className="font-bold text-slate-800 text-base mb-1">{lead.name}</h4>
                    <p className="text-xs font-medium text-slate-500 mb-4">{lead.project}</p>
                    
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-medium uppercase">Últ. Contato</span>
                        <span className="text-xs font-bold text-slate-700">{lead.time}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-green-200 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition-colors">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Column 3: Visita/Apresentação */}
          <div className="w-[320px] flex flex-col gap-3 h-full">
            <div className="flex items-center justify-between px-2 py-1 border-b-2 border-amber-500">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                Visita Agendada
              </h3>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-bold">{kanbanData.visit.length}</Badge>
            </div>
            
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 pb-2">
              {kanbanData.visit.map(lead => (
                <Card key={lead.id} className="cursor-grab hover:border-emerald-400 hover:shadow-lg transition-all border-slate-200 shadow-sm bg-white">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="secondary" className="text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5" /> {lead.time}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-slate-400">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    <h4 className="font-bold text-slate-800 text-base mb-1">{lead.name}</h4>
                    <p className="text-xs font-medium text-slate-500 mb-4">{lead.project}</p>
                    
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-medium uppercase">Corretor</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-5 w-5 border border-slate-200">
                            <AvatarFallback className="bg-slate-100 text-[8px] font-bold text-slate-600">CR</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold text-slate-700">Carlos R.</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-green-200 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition-colors">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Column 4: Proposta */}
          <div className="w-[320px] flex flex-col gap-3 h-full">
            <div className="flex items-center justify-between px-2 py-1 border-b-2 border-emerald-500">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                Proposta / Negociação
              </h3>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-bold">{kanbanData.proposal.length}</Badge>
            </div>
            
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 pb-2">
              {kanbanData.proposal.map(lead => (
                <Card key={lead.id} className="cursor-grab hover:border-emerald-500 hover:shadow-lg transition-all border-emerald-200 shadow-md bg-gradient-to-b from-emerald-50/50 to-white">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge className="text-[10px] font-bold bg-emerald-500 uppercase tracking-wider">
                        Gerando Contrato
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-slate-400">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    <h4 className="font-bold text-slate-800 text-base mb-1">{lead.name}</h4>
                    <p className="text-xs font-medium text-slate-500 mb-4">{lead.project}</p>
                    
                    <div className="flex items-center justify-between border-t border-emerald-100 pt-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-emerald-600/70 font-bold uppercase">VGV Potencial</span>
                        <span className="text-sm font-black text-emerald-700">{lead.value}</span>
                      </div>
                      <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold">
                        Aprovar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}