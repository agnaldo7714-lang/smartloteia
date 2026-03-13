import { useState } from "react";
import { Calculator, ArrowRight, Save, Send, Copy, AlertCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function Simulator() {
  const [propertyValue, setPropertyValue] = useState(180000);
  const [downPaymentPerc, setDownPaymentPerc] = useState(15);
  const [installments, setInstallments] = useState(120);
  const [interestRate, setInterestRate] = useState(0.85); // 0.85% ao mês
  const [includeIGPM, setIncludeIGPM] = useState(true);

  const downPayment = (propertyValue * downPaymentPerc) / 100;
  const financedAmount = propertyValue - downPayment;
  
  // Cálculo simplificado de Tabela Price (apenas demonstração)
  const rate = interestRate / 100;
  const pmt = (financedAmount * rate * Math.pow(1 + rate, installments)) / (Math.pow(1 + rate, installments) - 1);
  const firstInstallment = pmt;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Simulador de Parcelas</h1>
          <p className="text-slate-500">Crie simulações de financiamento direto com a loteadora e envie ao cliente.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-white text-slate-700">
            <Save className="h-4 w-4" /> Salvar Proposta
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
            <Send className="h-4 w-4" /> Enviar por WhatsApp
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulário de Simulação */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-md border-slate-200 bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                Dados do Financiamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              
              {/* Seleção do Lote */}
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">Empreendimento e Lote (Opcional)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Select>
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bosque">Bosque das Águas</SelectItem>
                      <SelectItem value="jardins">Jardins do Sul</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Quadra / Lote" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a01">Quadra A - Lote 01</SelectItem>
                      <SelectItem value="a02">Quadra A - Lote 02</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-slate-100" />

              {/* Valor e Entrada */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-bold text-slate-700">Valor à Vista do Lote</Label>
                    <span className="text-lg font-black text-slate-900">
                      R$ {propertyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <Slider 
                      value={[propertyValue]} 
                      max={500000} 
                      step={5000}
                      onValueChange={(val) => setPropertyValue(val[0])}
                      className="flex-1 [&>span:first-child]:bg-emerald-100 [&_[role=slider]]:bg-emerald-600 [&_[role=slider]]:border-emerald-600"
                    />
                    <Input 
                      type="number" 
                      value={propertyValue} 
                      onChange={(e) => setPropertyValue(Number(e.target.value))}
                      className="w-32 font-medium bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-bold text-slate-700">Entrada (Sinal)</Label>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-600">
                        R$ {downPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm font-bold text-slate-400 ml-2">({downPaymentPerc}%)</span>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <Slider 
                      value={[downPaymentPerc]} 
                      max={50} 
                      min={10}
                      step={1}
                      onValueChange={(val) => setDownPaymentPerc(val[0])}
                      className="flex-1 [&>span:first-child]:bg-emerald-100 [&_[role=slider]]:bg-emerald-600 [&_[role=slider]]:border-emerald-600"
                    />
                    <div className="relative w-32">
                      <Input 
                        type="number" 
                        value={downPaymentPerc} 
                        onChange={(e) => setDownPaymentPerc(Number(e.target.value))}
                        className="w-full pr-8 font-medium bg-slate-50"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-100" />

              {/* Condições */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700">Prazo (Meses)</Label>
                  <Select value={installments.toString()} onValueChange={(v) => setInstallments(Number(v))}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 font-bold text-slate-800">
                      <SelectValue placeholder="Selecione o prazo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12x (1 ano)</SelectItem>
                      <SelectItem value="24">24x (2 anos)</SelectItem>
                      <SelectItem value="36">36x (3 anos)</SelectItem>
                      <SelectItem value="48">48x (4 anos)</SelectItem>
                      <SelectItem value="60">60x (5 anos)</SelectItem>
                      <SelectItem value="120">120x (10 anos)</SelectItem>
                      <SelectItem value="180">180x (15 anos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700">Taxa de Juros (% a.m.)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={interestRate} 
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="bg-slate-50 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-800">Correção Monetária (IGP-M / IPCA)</Label>
                  <p className="text-xs text-slate-500">Aplicar correção anual nas parcelas</p>
                </div>
                <Switch 
                  checked={includeIGPM} 
                  onCheckedChange={setIncludeIGPM} 
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Resultado */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <Card className="shadow-xl border-emerald-500 bg-emerald-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -z-10" />
              <CardHeader className="pb-2">
                <CardTitle className="text-emerald-50 font-medium text-sm uppercase tracking-wider">
                  Resumo da Simulação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="bg-emerald-700/50 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-emerald-100 text-sm font-medium mb-1">Valor Financiado</p>
                  <p className="text-2xl font-black">
                    R$ {financedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">Parcelas Mensais</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black">{installments}x</span>
                    <span className="text-lg font-medium text-emerald-200 mb-1">de</span>
                  </div>
                  <div className="text-4xl font-black mt-1">
                    R$ {firstInstallment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  {includeIGPM && (
                    <p className="text-xs font-medium text-emerald-200 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> + Correção anual (IGP-M/IPCA)
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t border-white/20 text-sm font-medium text-emerald-50">
                  <div className="flex justify-between">
                    <span>Sinal / Entrada:</span>
                    <span className="font-bold">R$ {downPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Juros aplicados:</span>
                    <span className="font-bold">{interestRate}% a.m.</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sistema de Amortização:</span>
                    <span className="font-bold">Tabela Price</span>
                  </div>
                </div>

              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-4 flex gap-3">
                <Button className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white shadow-sm font-bold gap-2">
                  <Send className="w-4 h-4" /> Enviar Proposta
                </Button>
                <Button variant="outline" size="icon" className="border-slate-300 text-slate-600 hover:bg-slate-50">
                  <Copy className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}