import { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Calculator,
  Save,
  Send,
  Copy,
  AlertCircle,
  FolderOpen,
  UserRound,
  Building2,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type DevelopmentItem = {
  id: string;
  name: string;
  isActive?: boolean;
};

type LotItem = {
  id: string;
  developmentId: string;
  developmentName?: string;
  code: string;
  block: string;
  lot: string;
  areaM2?: number;
  frontM?: number;
  price: string;
  status: string;
};

type ClientItem = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  status?: string | null;
};

type ProposalSummary = {
  id: string;
  clientName: string;
  developmentName?: string | null;
  lotCode?: string | null;
  propertyValue: number;
  installments: number;
  firstInstallment: number;
  updatedAt?: string;
};

type ProposalDetail = {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone?: string | null;
  clientEmail?: string | null;
  developmentId?: string | null;
  developmentName?: string | null;
  lotId?: string | null;
  lotCode?: string | null;
  propertyValue: number;
  downPaymentPerc: number;
  downPaymentValue: number;
  financedAmount: number;
  installments: number;
  interestRate: number;
  includeIGPM: boolean;
  firstInstallment: number;
  notes?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

function parseMoneyLike(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;

  const normalized = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function onlyDigits(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

function toWhatsappNumber(phone?: string | null) {
  const digits = onlyDigits(phone);
  if (!digits) return "";

  if (digits.startsWith("55")) return digits;
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;

  return digits;
}

function calcPriceInstallment(
  financedAmount: number,
  monthlyRatePerc: number,
  months: number,
) {
  if (months <= 0) return 0;

  const rate = monthlyRatePerc / 100;
  if (rate <= 0) {
    return financedAmount / months;
  }

  const pmt =
    (financedAmount * rate * Math.pow(1 + rate, months)) /
    (Math.pow(1 + rate, months) - 1);

  return Number.isFinite(pmt) ? pmt : 0;
}

export default function Simulator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedProposalId, setSelectedProposalId] = useState<string>("NONE");
  const [selectedClientId, setSelectedClientId] = useState<string>("NONE");
  const [selectedDevelopmentId, setSelectedDevelopmentId] =
    useState<string>("NONE");
  const [selectedLotId, setSelectedLotId] = useState<string>("NONE");

  const [propertyValue, setPropertyValue] = useState(180000);
  const [downPaymentPerc, setDownPaymentPerc] = useState(15);
  const [installments, setInstallments] = useState(120);
  const [interestRate, setInterestRate] = useState(0.85);
  const [includeIGPM, setIncludeIGPM] = useState(true);
  const [notes, setNotes] = useState("");

  const { data: developments = [] } = useQuery<DevelopmentItem[]>({
    queryKey: ["/api/admin/developments"],
    retry: false,
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/developments");
      return await response.json();
    },
  });

  const { data: clients = [] } = useQuery<ClientItem[]>({
    queryKey: ["/api/admin/clients"],
    retry: false,
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/clients");
      return await response.json();
    },
  });

  const activeClients = useMemo(
    () => clients.filter((item) => item.status !== "inactive"),
    [clients],
  );

  const activeDevelopments = useMemo(
    () => developments.filter((item) => item.isActive !== false),
    [developments],
  );

  const { data: lots = [] } = useQuery<LotItem[]>({
    queryKey: ["/api/admin/lots", selectedDevelopmentId],
    retry: false,
    enabled: selectedDevelopmentId !== "NONE",
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/admin/lots?developmentId=${selectedDevelopmentId}`,
      );
      return await response.json();
    },
  });

  const availableLots = useMemo(
    () => lots.filter((item) => item.status !== "Vendido"),
    [lots],
  );

  const { data: proposals = [] } = useQuery<ProposalSummary[]>({
    queryKey: ["/api/proposals"],
    retry: false,
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/proposals");
      return await response.json();
    },
  });

  const { data: proposalDetail } = useQuery<ProposalDetail>({
    queryKey: ["/api/proposals", selectedProposalId],
    retry: false,
    enabled: selectedProposalId !== "NONE",
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/proposals/${selectedProposalId}`,
      );
      return await response.json();
    },
  });

  const selectedClient = useMemo(
    () => activeClients.find((item) => item.id === selectedClientId),
    [activeClients, selectedClientId],
  );

  const selectedDevelopment = useMemo(
    () => activeDevelopments.find((item) => item.id === selectedDevelopmentId),
    [activeDevelopments, selectedDevelopmentId],
  );

  const selectedLot = useMemo(
    () => availableLots.find((item) => item.id === selectedLotId),
    [availableLots, selectedLotId],
  );

  useEffect(() => {
    if (!proposalDetail) return;

    setSelectedClientId(proposalDetail.clientId || "NONE");
    setSelectedDevelopmentId(proposalDetail.developmentId || "NONE");
    setSelectedLotId(proposalDetail.lotId || "NONE");
    setPropertyValue(Number(proposalDetail.propertyValue || 0));
    setDownPaymentPerc(Number(proposalDetail.downPaymentPerc || 0));
    setInstallments(Number(proposalDetail.installments || 1));
    setInterestRate(Number(proposalDetail.interestRate || 0));
    setIncludeIGPM(Boolean(proposalDetail.includeIGPM));
    setNotes(proposalDetail.notes || "");
  }, [proposalDetail]);

  useEffect(() => {
    if (!selectedLot) return;

    const lotPrice = parseMoneyLike(selectedLot.price);
    if (lotPrice > 0) {
      setPropertyValue(lotPrice);
    }
  }, [selectedLot]);

  const downPayment = useMemo(
    () => (propertyValue * downPaymentPerc) / 100,
    [propertyValue, downPaymentPerc],
  );

  const financedAmount = useMemo(
    () => propertyValue - downPayment,
    [propertyValue, downPayment],
  );

  const firstInstallment = useMemo(
    () => calcPriceInstallment(financedAmount, interestRate, installments),
    [financedAmount, interestRate, installments],
  );

  const saveProposalMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient) {
        throw new Error("Selecione o cliente da proposta");
      }

      const payload = {
        clientId: selectedClient.id,
        clientName: selectedClient.fullName,
        clientPhone: selectedClient.phone ?? null,
        clientEmail: selectedClient.email ?? null,
        developmentId:
          selectedDevelopmentId !== "NONE" ? selectedDevelopmentId : null,
        developmentName: selectedDevelopment?.name ?? null,
        lotId: selectedLotId !== "NONE" ? selectedLotId : null,
        lotCode: selectedLot?.code ?? null,
        propertyValue,
        downPaymentPerc,
        downPaymentValue: downPayment,
        financedAmount,
        installments,
        interestRate,
        includeIGPM,
        firstInstallment,
        notes: notes || null,
        status: "draft",
      };

      if (selectedProposalId !== "NONE") {
        const response = await apiRequest(
          "PUT",
          `/api/proposals/${selectedProposalId}`,
          payload,
        );
        return await response.json();
      }

      const response = await apiRequest("POST", "/api/proposals", payload);
      return await response.json();
    },
    onSuccess: async (data: any) => {
      toast({
        title: "Proposta salva",
        description: "A proposta foi salva com sucesso.",
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });

      if (data?.id) {
        setSelectedProposalId(data.id);
      }
    },
    onError: async (error: any) => {
      let message = error?.message || "Não foi possível salvar a proposta.";

      try {
        if (error?.response?.json) {
          const data = await error.response.json();
          message = data?.message || message;
        }
      } catch {}

      toast({
        title: "Erro ao salvar proposta",
        description: message,
        variant: "destructive",
      });
    },
  });

  function buildProposalMessage() {
    if (!selectedClient) return "";

    const lines = [
      `Olá, ${selectedClient.fullName}!`,
      "",
      "Segue a simulação da proposta:",
      selectedDevelopment ? `Empreendimento: ${selectedDevelopment.name}` : null,
      selectedLot ? `Lote: ${selectedLot.code}` : null,
      `Valor do lote: R$ ${formatMoney(propertyValue)}`,
      `Entrada: R$ ${formatMoney(downPayment)} (${downPaymentPerc}%)`,
      `Valor financiado: R$ ${formatMoney(financedAmount)}`,
      `Parcelamento: ${installments}x de R$ ${formatMoney(firstInstallment)}`,
      `Juros: ${interestRate}% a.m.`,
      includeIGPM
        ? "Correção monetária: com IGP-M/IPCA"
        : "Correção monetária: sem correção",
      notes ? `Observações: ${notes}` : null,
    ].filter(Boolean);

    return lines.join("\n");
  }

  async function handleCopyProposal() {
    const message = buildProposalMessage();

    if (!message) {
      toast({
        title: "Selecione o cliente",
        description: "Escolha o cliente antes de copiar a proposta.",
        variant: "destructive",
      });
      return;
    }

    await navigator.clipboard.writeText(message);

    toast({
      title: "Copiado",
      description: "A proposta foi copiada para a área de transferência.",
    });
  }

  function handleWhatsappSend() {
    if (!selectedClient) {
      toast({
        title: "Selecione o cliente",
        description: "Escolha o cliente antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    const phone = toWhatsappNumber(selectedClient.phone);
    if (!phone) {
      toast({
        title: "Cliente sem telefone",
        description: "Esse cliente não possui telefone válido para WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    const text = buildProposalMessage();
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

    window.open(url, "_blank");

    toast({
      title: "WhatsApp aberto",
      description: "A proposta foi preparada para envio ao cliente.",
    });
  }

  function handleLoadSavedProposal(value: string) {
    setSelectedProposalId(value);

    if (value === "NONE") {
      setSelectedClientId("NONE");
      setSelectedDevelopmentId("NONE");
      setSelectedLotId("NONE");
      setPropertyValue(180000);
      setDownPaymentPerc(15);
      setInstallments(120);
      setInterestRate(0.85);
      setIncludeIGPM(true);
      setNotes("");
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Simulador de Proposta
          </h1>
          <p className="text-slate-500">
            Monte propostas com empreendimento real, cliente, lote e envio por
            WhatsApp.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-white text-slate-700"
            onClick={() => saveProposalMutation.mutate()}
            disabled={saveProposalMutation.isPending}
          >
            <Save className="h-4 w-4" />
            {saveProposalMutation.isPending ? "Salvando..." : "Salvar Proposta"}
          </Button>

          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            onClick={handleWhatsappSend}
          >
            <Send className="h-4 w-4" />
            Enviar por WhatsApp
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6 min-w-0">
          <Card className="shadow-md border-slate-200 bg-white overflow-visible">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                Dados da Proposta
              </CardTitle>
              <CardDescription>
                Selecione cliente, empreendimento, lote e condições de pagamento.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-8 overflow-visible">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 min-w-0">
                  <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Proposta salva
                  </Label>
                  <Select
                    value={selectedProposalId}
                    onValueChange={handleLoadSavedProposal}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Carregar proposta salva" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="NONE">Nova proposta</SelectItem>
                      {proposals.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.clientName} • {item.developmentName || "Sem empreendimento"} •{" "}
                          {item.lotCode || "Sem lote"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 min-w-0">
                  <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <UserRound className="w-4 h-4" />
                    Cliente da proposta *
                  </Label>
                  <Select
                    value={selectedClientId}
                    onValueChange={setSelectedClientId}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="NONE">Selecione...</SelectItem>
                      {activeClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedClient ? (
                <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">
                    {selectedClient.fullName}
                  </div>
                  <div>{selectedClient.phone || "-"}</div>
                  <div>{selectedClient.email || "-"}</div>
                  <div>{selectedClient.city || "-"}</div>
                </div>
              ) : null}

              <Separator className="bg-slate-100" />

              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Empreendimento e Lote
                </Label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    value={selectedDevelopmentId}
                    onValueChange={(value) => {
                      setSelectedDevelopmentId(value);
                      setSelectedLotId("NONE");
                    }}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Selecione o empreendimento" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="NONE">Selecione...</SelectItem>
                      {activeDevelopments.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedLotId}
                    onValueChange={setSelectedLotId}
                    disabled={selectedDevelopmentId === "NONE"}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Quadra / Lote" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="NONE">Selecione...</SelectItem>
                      {availableLots.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.code} • {item.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedLot ? (
                  <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
                    <div className="font-semibold text-slate-900">
                      {selectedLot.code}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {selectedDevelopment?.name || "-"}
                    </div>
                    <div>Quadra: {selectedLot.block}</div>
                    <div>Lote: {selectedLot.lot}</div>
                    <div>Área: {selectedLot.areaM2 || 0} m²</div>
                    <div>
                      Preço base: R$ {formatMoney(parseMoneyLike(selectedLot.price))}
                    </div>
                  </div>
                ) : null}
              </div>

              <Separator className="bg-slate-100" />

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center gap-4">
                    <Label className="text-sm font-bold text-slate-700">
                      Valor à Vista do Lote
                    </Label>
                    <span className="text-lg font-black text-slate-900">
                      R$ {formatMoney(propertyValue)}
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
                      className="w-36 font-medium bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center gap-4">
                    <Label className="text-sm font-bold text-slate-700">
                      Entrada (Sinal)
                    </Label>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-600">
                        R$ {formatMoney(downPayment)}
                      </span>
                      <span className="text-sm font-bold text-slate-400 ml-2">
                        ({downPaymentPerc}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <Slider
                      value={[downPaymentPerc]}
                      max={70}
                      min={0}
                      step={1}
                      onValueChange={(val) => setDownPaymentPerc(val[0])}
                      className="flex-1 [&>span:first-child]:bg-emerald-100 [&_[role=slider]]:bg-emerald-600 [&_[role=slider]]:border-emerald-600"
                    />
                    <div className="relative w-36">
                      <Input
                        type="number"
                        value={downPaymentPerc}
                        onChange={(e) => setDownPaymentPerc(Number(e.target.value))}
                        className="w-full pr-8 font-medium bg-slate-50"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-100" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700">
                    Prazo (Meses)
                  </Label>
                  <Select
                    value={installments.toString()}
                    onValueChange={(v) => setInstallments(Number(v))}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200 font-bold text-slate-800">
                      <SelectValue placeholder="Selecione o prazo" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
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
                  <Label className="text-sm font-bold text-slate-700">
                    Taxa de Juros (% a.m.)
                  </Label>
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
                  <Label className="text-sm font-bold text-slate-800">
                    Correção Monetária (IGP-M / IPCA)
                  </Label>
                  <p className="text-xs text-slate-500">
                    Aplicar correção anual nas parcelas
                  </p>
                </div>
                <Switch
                  checked={includeIGPM}
                  onCheckedChange={setIncludeIGPM}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700">
                  Observações da proposta
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Condições especiais, desconto, observações..."
                  className="min-h-[100px] bg-slate-50"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 min-w-0">
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
                  <p className="text-emerald-100 text-sm font-medium mb-1">
                    Valor Financiado
                  </p>
                  <p className="text-2xl font-black">
                    R$ {formatMoney(financedAmount)}
                  </p>
                </div>

                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">
                    Parcelas Mensais
                  </p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black">{installments}x</span>
                    <span className="text-lg font-medium text-emerald-200 mb-1">
                      de
                    </span>
                  </div>
                  <div className="text-4xl font-black mt-1">
                    R$ {formatMoney(firstInstallment)}
                  </div>
                  {includeIGPM && (
                    <p className="text-xs font-medium text-emerald-200 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      + Correção anual (IGP-M/IPCA)
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t border-white/20 text-sm font-medium text-emerald-50">
                  <div className="flex justify-between">
                    <span>Cliente:</span>
                    <span className="font-bold">
                      {selectedClient?.fullName || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Empreendimento:</span>
                    <span className="font-bold">
                      {selectedDevelopment?.name || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lote:</span>
                    <span className="font-bold">{selectedLot?.code || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sinal / Entrada:</span>
                    <span className="font-bold">
                      R$ {formatMoney(downPayment)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Juros aplicados:</span>
                    <span className="font-bold">{interestRate}% a.m.</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sistema:</span>
                    <span className="font-bold">Tabela Price</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-4 flex gap-3">
                <Button
                  className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white shadow-sm font-bold gap-2"
                  onClick={handleWhatsappSend}
                >
                  <Send className="w-4 h-4" />
                  Enviar Proposta
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="border-slate-300 text-slate-600 hover:bg-slate-50"
                  onClick={handleCopyProposal}
                >
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