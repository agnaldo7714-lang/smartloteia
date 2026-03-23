import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CheckCircle2,
  Filter,
  Phone,
  PlusCircle,
  Search,
  UserCheck,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

type LeadStatus =
  | "NOVO"
  | "CONTATO"
  | "VISITA"
  | "PROPOSTA"
  | "RESERVA"
  | "CONTRATO"
  | "VENDIDO"
  | "PERDIDO";

type BrokerItem = {
  id: string;
  billingEntityId?: string;
  billingEntityName?: string;
  corporateName?: string;
  tradeName?: string;
  isActive?: boolean;
};

type DevelopmentItem = {
  id: string;
  name: string;
};

type ClientItem = {
  id: string;
  name?: string;
};

type LeadItem = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  source?: string | null;
  notes?: string | null;
  status: LeadStatus;
  brokerId?: string | null;
  developmentId?: string | null;
  clientId?: string | null;
  createdAt?: string;
  broker?: BrokerItem | null;
  development?: DevelopmentItem | null;
  client?: ClientItem | null;
};

type CreateLeadForm = {
  name: string;
  phone: string;
  email: string;
  source: string;
  notes: string;
  brokerId: string;
  developmentId: string;
};

type ActionLeadForm = {
  status: LeadStatus;
  brokerId: string;
  notes: string;
};

type Filters = {
  search: string;
  status: string;
  brokerId: string;
  source: string;
};

const statusOptions: LeadStatus[] = [
  "NOVO",
  "CONTATO",
  "VISITA",
  "PROPOSTA",
  "RESERVA",
  "CONTRATO",
  "VENDIDO",
  "PERDIDO",
];

const statusLabel: Record<LeadStatus, string> = {
  NOVO: "Novo",
  CONTATO: "Contato",
  VISITA: "Visita",
  PROPOSTA: "Proposta",
  RESERVA: "Reserva",
  CONTRATO: "Contrato",
  VENDIDO: "Vendido",
  PERDIDO: "Perdido",
};

function getToken() {
  return (
    localStorage.getItem("smartlote_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("smartlote_token") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

async function requestJson<T = any>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const token = getToken();

  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || "Erro na requisição");
  }

  return data;
}

function buildLeadQuery(filters: Filters) {
  const params = new URLSearchParams();

  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.status && filters.status !== "ALL")
    params.set("status", filters.status);
  if (filters.brokerId && filters.brokerId !== "ALL")
    params.set("brokerId", filters.brokerId);
  if (filters.source && filters.source !== "ALL")
    params.set("source", filters.source);

  const query = params.toString();
  return query ? `/api/leads?${query}` : "/api/leads";
}

function getBrokerName(broker?: BrokerItem | null) {
  if (!broker) return "-";
  return (
    broker.billingEntityName ||
    broker.tradeName ||
    broker.corporateName ||
    "-"
  );
}

function getBadgeVariant(status: LeadStatus) {
  switch (status) {
    case "NOVO":
      return "secondary";
    case "CONTATO":
      return "outline";
    case "VISITA":
      return "default";
    case "PROPOSTA":
      return "secondary";
    case "RESERVA":
      return "default";
    case "CONTRATO":
      return "default";
    case "VENDIDO":
      return "default";
    case "PERDIDO":
      return "destructive";
    default:
      return "secondary";
  }
}

export default function LeadsPage() {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "ALL",
    brokerId: "ALL",
    source: "ALL",
  });

  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);

  const [createForm, setCreateForm] = useState<CreateLeadForm>({
    name: "",
    phone: "",
    email: "",
    source: "",
    notes: "",
    brokerId: "NONE",
    developmentId: "NONE",
  });

  const [actionForm, setActionForm] = useState<ActionLeadForm>({
    status: "CONTATO",
    brokerId: "NONE",
    notes: "",
  });

  const {
    data: leads = [],
    isLoading,
    refetch,
  } = useQuery<LeadItem[]>({
    queryKey: ["/api/leads", filters],
    queryFn: async () => requestJson<LeadItem[]>(buildLeadQuery(filters)),
  });

  const { data: brokers = [] } = useQuery<BrokerItem[]>({
    queryKey: ["/api/brokers"],
    queryFn: async () => requestJson<BrokerItem[]>("/api/brokers"),
  });

  const { data: developments = [] } = useQuery<DevelopmentItem[]>({
    queryKey: ["/api/developments"],
    queryFn: async () => {
      try {
        return await requestJson<DevelopmentItem[]>("/api/developments");
      } catch {
        return [];
      }
    },
  });

  const activeBrokers = useMemo(
    () => brokers.filter((item) => item.isActive !== false),
    [brokers]
  );

  const totalByStatus = useMemo(() => {
    return {
      total: leads.length,
      novos: leads.filter((l) => l.status === "NOVO").length,
      emAtendimento: leads.filter((l) =>
        ["CONTATO", "VISITA", "PROPOSTA"].includes(l.status)
      ).length,
      reservas: leads.filter((l) => l.status === "RESERVA").length,
      vendidos: leads.filter((l) => l.status === "VENDIDO").length,
      perdidos: leads.filter((l) => l.status === "PERDIDO").length,
    };
  }, [leads]);

  const createLeadMutation = useMutation({
    mutationFn: async () => {
      return requestJson("/api/leads", {
        method: "POST",
        body: JSON.stringify({
          name: createForm.name,
          phone: createForm.phone,
          email: createForm.email || null,
          source: createForm.source || null,
          notes: createForm.notes || null,
          brokerId:
            createForm.brokerId && createForm.brokerId !== "NONE"
              ? createForm.brokerId
              : null,
          developmentId:
            createForm.developmentId && createForm.developmentId !== "NONE"
              ? createForm.developmentId
              : null,
        }),
      });
    },
    onSuccess: async () => {
      toast({ title: "Lead criado com sucesso" });
      setLeadModalOpen(false);
      setCreateForm({
        name: "",
        phone: "",
        email: "",
        source: "",
        notes: "",
        brokerId: "NONE",
        developmentId: "NONE",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar lead",
        description: error?.message || "Falha ao salvar lead",
        variant: "destructive",
      });
    },
  });

  const approveLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      return requestJson(`/api/leads/${leadId}/approve`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
    },
    onSuccess: async () => {
      toast({ title: "Lead aprovado com sucesso" });
      await queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar lead",
        description: error?.message || "Falha ao aprovar lead",
        variant: "destructive",
      });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLead) throw new Error("Lead não selecionado");

      return requestJson(`/api/leads/${selectedLead.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: actionForm.status,
          brokerId:
            actionForm.brokerId && actionForm.brokerId !== "NONE"
              ? actionForm.brokerId
              : null,
          notes: actionForm.notes || null,
        }),
      });
    },
    onSuccess: async () => {
      toast({ title: "Lead atualizado com sucesso" });
      setActionModalOpen(false);
      setSelectedLead(null);
      await queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar lead",
        description: error?.message || "Falha ao atualizar lead",
        variant: "destructive",
      });
    },
  });

  function handleOpenActModal(lead: LeadItem) {
    setSelectedLead(lead);
    setActionForm({
      status: lead.status || "CONTATO",
      brokerId: lead.brokerId || "NONE",
      notes: lead.notes || "",
    });
    setActionModalOpen(true);
  }

  function handleCreateLead() {
    if (!createForm.name.trim()) {
      toast({
        title: "Informe o nome do lead",
        variant: "destructive",
      });
      return;
    }

    if (!createForm.phone.trim()) {
      toast({
        title: "Informe o telefone do lead",
        variant: "destructive",
      });
      return;
    }

    createLeadMutation.mutate();
  }

  function handleApplyFilters() {
    refetch();
  }

  function handleClearFilters() {
    setFilters({
      search: "",
      status: "ALL",
      brokerId: "ALL",
      source: "ALL",
    });
  }

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0">
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-xl sm:text-2xl">Leads</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Cadastro, aprovação e andamento comercial dos leads
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setLeadModalOpen(true)}
              className="gap-2 w-full sm:w-auto"
            >
              <PlusCircle className="h-4 w-4" />
              Novo Lead
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalByStatus.total}</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Novos</p>
                <p className="text-2xl font-bold">{totalByStatus.novos}</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Em atendimento</p>
                <p className="text-2xl font-bold">{totalByStatus.emAtendimento}</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Reservas</p>
                <p className="text-2xl font-bold">{totalByStatus.reservas}</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm sm:col-span-2 xl:col-span-1">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Vendidos</p>
                <p className="text-2xl font-bold">{totalByStatus.vendidos}</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Nome, telefone ou e-mail"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabel[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Corretor</Label>
              <Select
                value={filters.brokerId}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, brokerId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  {activeBrokers.map((broker) => (
                    <SelectItem key={broker.id} value={broker.id}>
                      {getBrokerName(broker)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Origem</Label>
              <Select
                value={filters.source}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, source: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Indicação">Indicação</SelectItem>
                  <SelectItem value="Site">Site</SelectItem>
                  <SelectItem value="Telefone">Telefone</SelectItem>
                  <SelectItem value="Plantão">Plantão</SelectItem>
                  <SelectItem value="Tráfego Pago">Tráfego Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Button onClick={handleApplyFilters} className="gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4" />
              Aplicar filtro
            </Button>

            <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Lista de Leads</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              Carregando leads...
            </div>
          ) : leads.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              Nenhum lead encontrado.
            </div>
          ) : (
            <>
              <div className="block lg:hidden space-y-4">
                {leads.map((lead) => (
                  <Card key={lead.id} className="border shadow-none">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 break-words">
                            {lead.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {lead.clientId ? "Cliente vinculado" : "Ainda não convertido"}
                          </div>
                        </div>

                        <Badge variant={getBadgeVariant(lead.status) as any}>
                          {statusLabel[lead.status]}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="rounded-lg bg-slate-50 p-3">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="break-words">{lead.phone}</span>
                          </div>
                          {lead.email ? (
                            <div className="text-xs text-muted-foreground mt-2 break-all">
                              {lead.email}
                            </div>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="rounded-lg bg-slate-50 p-3">
                            <div className="text-xs text-muted-foreground mb-1">Origem</div>
                            <div className="font-medium break-words">{lead.source || "-"}</div>
                          </div>

                          <div className="rounded-lg bg-slate-50 p-3">
                            <div className="text-xs text-muted-foreground mb-1">Corretor</div>
                            <div className="font-medium break-words">
                              {getBrokerName(lead.broker)}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-3">
                          <div className="text-xs text-muted-foreground mb-1">Empreendimento</div>
                          <div className="font-medium break-words">
                            {lead.development?.name || "-"}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleOpenActModal(lead)}
                        >
                          <UserCheck className="h-4 w-4" />
                          Atuar
                        </Button>

                        <Button
                          size="sm"
                          className="gap-2"
                          onClick={() => approveLeadMutation.mutate(lead.id)}
                          disabled={
                            approveLeadMutation.isPending ||
                            lead.status !== "NOVO"
                          }
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Aprovar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Corretor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {lead.clientId ? "Cliente vinculado" : "Ainda não convertido"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{lead.phone}</span>
                          </div>
                          {lead.email ? (
                            <div className="text-xs text-muted-foreground mt-1">
                              {lead.email}
                            </div>
                          ) : null}
                        </TableCell>

                        <TableCell>{lead.source || "-"}</TableCell>

                        <TableCell>{getBrokerName(lead.broker)}</TableCell>

                        <TableCell>
                          <Badge variant={getBadgeVariant(lead.status) as any}>
                            {statusLabel[lead.status]}
                          </Badge>
                        </TableCell>

                        <TableCell>{lead.development?.name || "-"}</TableCell>

                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => handleOpenActModal(lead)}
                            >
                              <UserCheck className="h-4 w-4" />
                              Atuar
                            </Button>

                            <Button
                              size="sm"
                              className="gap-2"
                              onClick={() => approveLeadMutation.mutate(lead.id)}
                              disabled={
                                approveLeadMutation.isPending ||
                                lead.status !== "NOVO"
                              }
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Aprovar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={leadModalOpen} onOpenChange={setLeadModalOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Nome do lead"
                />
              </div>

              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input
                  value={createForm.phone}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="Telefone"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="email@dominio.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Origem</Label>
                <Select
                  value={createForm.source || "NONE"}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      source: value === "NONE" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Não informar</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Indicação">Indicação</SelectItem>
                    <SelectItem value="Site">Site</SelectItem>
                    <SelectItem value="Telefone">Telefone</SelectItem>
                    <SelectItem value="Plantão">Plantão</SelectItem>
                    <SelectItem value="Tráfego Pago">Tráfego Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Corretor responsável</Label>
                <Select
                  value={createForm.brokerId}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      brokerId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar corretor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Não atribuir agora</SelectItem>
                    {activeBrokers.map((broker) => (
                      <SelectItem key={broker.id} value={broker.id}>
                        {getBrokerName(broker)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Empreendimento</Label>
                <Select
                  value={createForm.developmentId}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      developmentId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar empreendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Não informar</SelectItem>
                    {developments.map((dev) => (
                      <SelectItem key={dev.id} value={dev.id}>
                        {dev.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Observações do lead"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setLeadModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={handleCreateLead}
                disabled={createLeadMutation.isPending}
              >
                {createLeadMutation.isPending ? "Salvando..." : "Salvar lead"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atuar no Lead</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="rounded-lg border p-3 bg-muted/30">
              <div className="font-medium break-words">{selectedLead?.name || "-"}</div>
              <div className="text-sm text-muted-foreground break-words">
                {selectedLead?.phone || "-"}{" "}
                {selectedLead?.email ? `• ${selectedLead.email}` : ""}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={actionForm.status}
                  onValueChange={(value) =>
                    setActionForm((prev) => ({
                      ...prev,
                      status: value as LeadStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabel[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Corretor</Label>
                <Select
                  value={actionForm.brokerId}
                  onValueChange={(value) =>
                    setActionForm((prev) => ({
                      ...prev,
                      brokerId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar corretor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Sem corretor</SelectItem>
                    {activeBrokers.map((broker) => (
                      <SelectItem key={broker.id} value={broker.id}>
                        {getBrokerName(broker)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={actionForm.notes}
                onChange={(e) =>
                  setActionForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Registrar andamento, retorno, proposta, visita..."
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setActionModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={() => updateLeadMutation.mutate()}
                disabled={updateLeadMutation.isPending}
              >
                {updateLeadMutation.isPending ? "Salvando..." : "Salvar ação"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}