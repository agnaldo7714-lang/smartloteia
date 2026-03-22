import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { SafeUser } from "@shared/schema";
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  PlusCircle,
  Search,
  Trash2,
  UserRound,
  Pencil,
  BriefcaseBusiness,
  Eraser,
  UserCheck,
  LoaderCircle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

type ClientItem = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  objective?: string | null;
  budgetRange?: string | null;
  timeline?: string | null;
  profileNotes?: string | null;
  source?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  status?: string | null;
  brokerId?: string | null;
  brokerName?: string | null;
  assignedBroker?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type BrokerItem = {
  id: string;
  name: string;
  isActive: boolean;
  billingEntityName?: string | null;
};

type ClientFormState = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  objective: string;
  budgetRange: string;
  timeline: string;
  profileNotes: string;
  source: string;
  projectName: string;
  status: "lead" | "active" | "inactive";
  notes: string;
};

const emptyForm: ClientFormState = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  objective: "",
  budgetRange: "",
  timeline: "",
  profileNotes: "",
  source: "manual",
  projectName: "",
  status: "active",
  notes: "",
};

export default function ClientsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [openForm, setOpenForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null);
  const [form, setForm] = useState<ClientFormState>(emptyForm);

  const [brokerDialogOpen, setBrokerDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("NONE");

  const { data: currentUser, isLoading: loadingUser } = useQuery<SafeUser | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: clients = [], isLoading } = useQuery<ClientItem[]>({
    queryKey: ["/api/admin/clients"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/clients");
      return await response.json();
    },
  });

  const { data: brokers = [], isLoading: loadingBrokers } = useQuery<
    BrokerItem[]
  >({
    queryKey: ["/api/admin/brokers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/brokers");
      return await response.json();
    },
  });

  const canManageClients =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  const createClientMutation = useMutation({
    mutationFn: async (payload: ClientFormState) => {
      const response = await apiRequest("POST", "/api/admin/clients", {
        fullName: payload.fullName,
        phone: payload.phone || null,
        email: payload.email || null,
        city: payload.city || null,
        objective: payload.objective || null,
        budgetRange: payload.budgetRange || null,
        timeline: payload.timeline || null,
        profileNotes: payload.profileNotes || null,
        source: payload.source || "manual",
        projectId: null,
        projectName: payload.projectName || null,
        status: payload.status,
        notes: payload.notes || null,
      });
      return await response.json();
    },
    onSuccess: async () => {
      toast({ title: "Cliente cadastrado com sucesso" });
      setOpenForm(false);
      setEditingClient(null);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
    },
    onError: async (error: any) => {
      let message = error?.message || "Não foi possível cadastrar o cliente.";

      try {
        if (error?.response?.json) {
          const data = await error.response.json();
          message = data?.message || message;
        }
      } catch {}

      toast({
        title: "Erro ao cadastrar cliente",
        description: message,
        variant: "destructive",
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: ClientFormState;
    }) => {
      const response = await apiRequest("PUT", `/api/admin/clients/${id}`, {
        fullName: payload.fullName,
        phone: payload.phone || null,
        email: payload.email || null,
        city: payload.city || null,
        objective: payload.objective || null,
        budgetRange: payload.budgetRange || null,
        timeline: payload.timeline || null,
        profileNotes: payload.profileNotes || null,
        source: payload.source || "manual",
        projectId: null,
        projectName: payload.projectName || null,
        status: payload.status,
        notes: payload.notes || null,
      });
      return await response.json();
    },
    onSuccess: async () => {
      toast({ title: "Cliente atualizado com sucesso" });
      setOpenForm(false);
      setEditingClient(null);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
    },
    onError: async (error: any) => {
      let message = error?.message || "Não foi possível atualizar o cliente.";

      try {
        if (error?.response?.json) {
          const data = await error.response.json();
          message = data?.message || message;
        }
      } catch {}

      toast({
        title: "Erro ao atualizar cliente",
        description: message,
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/clients/${id}`);
      return await response.json();
    },
    onSuccess: async (data: any) => {
      toast({
        title: "Operação concluída",
        description:
          data?.message || "O cliente foi removido ou inativado com sucesso.",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
    },
    onError: async (error: any) => {
      let message = error?.message || "Não foi possível excluir o cliente.";

      try {
        if (error?.response?.json) {
          const data = await error.response.json();
          message = data?.message || message;
        }
      } catch {}

      toast({
        title: "Erro ao excluir cliente",
        description: message,
        variant: "destructive",
      });
    },
  });

  const purgeInactiveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/admin/clients/purge/inactive");
      return await response.json();
    },
    onSuccess: async (data: any) => {
      toast({
        title: "Limpeza concluída",
        description: `${data?.deletedCount ?? 0} cliente(s) inativo(s) removido(s).`,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
    },
    onError: async (error: any) => {
      let message = error?.message || "Não foi possível limpar os inativos.";

      try {
        if (error?.response?.json) {
          const data = await error.response.json();
          message = data?.message || message;
        }
      } catch {}

      toast({
        title: "Erro ao limpar inativos",
        description: message,
        variant: "destructive",
      });
    },
  });

  const assignBrokerMutation = useMutation({
    mutationFn: async ({
      clientId,
      brokerId,
    }: {
      clientId: string;
      brokerId: string | null;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/clients/${clientId}/assign-broker`,
        { brokerId },
      );
      return await response.json();
    },
    onSuccess: async (data: any) => {
      toast({
        title: "Corretor atualizado",
        description: data?.message || "Vínculo atualizado com sucesso.",
      });
      setBrokerDialogOpen(false);
      setSelectedClient(null);
      setSelectedBrokerId("NONE");
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
    },
    onError: async (error: any) => {
      let message =
        error?.message || "Não foi possível atualizar o corretor do cliente.";

      try {
        if (error?.response?.json) {
          const data = await error.response.json();
          message = data?.message || message;
        }
      } catch {}

      toast({
        title: "Erro ao atualizar corretor",
        description: message,
        variant: "destructive",
      });
    },
  });

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    let base = clients;

    if (statusFilter !== "all") {
      base = base.filter((item) => (item.status || "").toLowerCase() === statusFilter);
    }

    if (!term) return base;

    return base.filter((item) => {
      const text = [
        item.fullName,
        item.phone,
        item.email,
        item.city,
        item.objective,
        item.budgetRange,
        item.timeline,
        item.profileNotes,
        item.source,
        item.projectName,
        item.status,
        item.brokerName,
        item.assignedBroker,
        item.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [clients, search, statusFilter]);

  const activeBrokers = useMemo(() => {
    return brokers.filter((item) => item.isActive);
  }, [brokers]);

  function openCreateModal() {
    setEditingClient(null);
    setForm(emptyForm);
    setOpenForm(true);
  }

  function openEditModal(item: ClientItem) {
    setEditingClient(item);
    setForm({
      fullName: item.fullName || "",
      phone: item.phone || "",
      email: item.email || "",
      city: item.city || "",
      objective: item.objective || "",
      budgetRange: item.budgetRange || "",
      timeline: item.timeline || "",
      profileNotes: item.profileNotes || "",
      source: item.source || "manual",
      projectName: item.projectName || "",
      status:
        item.status === "lead" || item.status === "inactive"
          ? item.status
          : "active",
      notes: item.notes || "",
    });
    setOpenForm(true);
  }

  function openBrokerModal(item: ClientItem) {
    setSelectedClient(item);
    setSelectedBrokerId(item.brokerId || "NONE");
    setBrokerDialogOpen(true);
  }

  function handleSave() {
    if (!form.fullName.trim()) {
      toast({
        title: "Informe o nome do cliente",
        variant: "destructive",
      });
      return;
    }

    if (editingClient) {
      updateClientMutation.mutate({
        id: editingClient.id,
        payload: form,
      });
      return;
    }

    createClientMutation.mutate(form);
  }

  function handleDelete(item: ClientItem) {
    const ok = window.confirm(
      `Deseja realmente excluir/inativar o cliente "${item.fullName}"?`,
    );

    if (!ok) return;
    deleteClientMutation.mutate(item.id);
  }

  function handlePurgeInactive() {
    const ok = window.confirm(
      "Deseja remover todos os clientes inativos sem histórico de vendas?",
    );

    if (!ok) return;
    purgeInactiveMutation.mutate();
  }

  function handleSaveBroker() {
    if (!selectedClient) return;

    assignBrokerMutation.mutate({
      clientId: selectedClient.id,
      brokerId: selectedBrokerId === "NONE" ? null : selectedBrokerId,
    });
  }

  const total = clients.length;
  const activeCount = clients.filter((item) => item.status === "active").length;
  const leadCount = clients.filter((item) => item.status === "lead").length;
  const inactiveCount = clients.filter((item) => item.status === "inactive").length;

  if (loadingUser) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Carregando perfil...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Total de clientes</CardDescription>
            <CardTitle className="text-3xl">{total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <UserRound className="h-4 w-4" />
              Cadastro geral
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Ativos</CardDescription>
            <CardTitle className="text-3xl">{activeCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <UserCheck className="h-4 w-4" />
              Em negociação/operação
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Leads</CardDescription>
            <CardTitle className="text-3xl">{leadCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <BriefcaseBusiness className="h-4 w-4" />
              Em prospecção
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Inativos</CardDescription>
            <CardTitle className="text-3xl">{inactiveCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Building2 className="h-4 w-4" />
              Fora da operação
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>
              Admin e gestor podem cadastrar, editar, excluir/inativar e atribuir corretor.
              Corretor vê os dados comerciais vinculados.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[280px]">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome, telefone, e-mail, empreendimento, corretor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="min-w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {canManageClients ? (
              <>
                <Button
                  variant="outline"
                  onClick={handlePurgeInactive}
                  className="gap-2"
                  disabled={purgeInactiveMutation.isPending}
                >
                  <Eraser className="h-4 w-4" />
                  Limpar inativos
                </Button>

                <Button onClick={openCreateModal} className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Novo cliente
                </Button>
              </>
            ) : null}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              Carregando clientes...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              Nenhum cliente encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Local / Origem</TableHead>
                    <TableHead>Empreendimento</TableHead>
                    <TableHead>Corretor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredClients.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.objective || item.profileNotes || "Sem detalhes"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{item.phone || "-"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{item.email || "-"}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{item.city || "-"}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Origem: {item.source || "-"}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>{item.projectName || "-"}</TableCell>

                      <TableCell>
                        {item.brokerName ? (
                          <Badge>{item.brokerName}</Badge>
                        ) : (
                          <Badge variant="secondary">Sem corretor</Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">{item.status || "active"}</Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {canManageClients ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => openBrokerModal(item)}
                              >
                                <BriefcaseBusiness className="h-4 w-4" />
                                Corretor
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => openEditModal(item)}
                              >
                                <Pencil className="h-4 w-4" />
                                Editar
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                className="gap-2"
                                onClick={() => handleDelete(item)}
                                disabled={deleteClientMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Visualização
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-[820px]">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Editar cliente" : "Novo cliente"}
            </DialogTitle>
            <DialogDescription>
              Admin e gestor podem manter o cadastro completo do cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome *</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  placeholder="Informe o nome do cliente"
                />
              </div>

              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Informe o telefone"
                />
              </div>

              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Informe o e-mail"
                />
              </div>

              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={form.city}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="Informe a cidade"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: "lead" | "active" | "inactive") =>
                    setForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Origem</Label>
                <Input
                  value={form.source}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, source: e.target.value }))
                  }
                  placeholder="landing_ai, manual, indicação..."
                />
              </div>

              <div className="space-y-2">
                <Label>Empreendimento</Label>
                <Input
                  value={form.projectName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, projectName: e.target.value }))
                  }
                  placeholder="Empreendimento de interesse"
                />
              </div>

              <div className="space-y-2">
                <Label>Objetivo</Label>
                <Input
                  value={form.objective}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, objective: e.target.value }))
                  }
                  placeholder="Ex.: compra para moradia"
                />
              </div>

              <div className="space-y-2">
                <Label>Faixa de orçamento</Label>
                <Input
                  value={form.budgetRange}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, budgetRange: e.target.value }))
                  }
                  placeholder="Ex.: até 180 mil"
                />
              </div>

              <div className="space-y-2">
                <Label>Prazo</Label>
                <Input
                  value={form.timeline}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, timeline: e.target.value }))
                  }
                  placeholder="Ex.: 30 dias"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Perfil / observações comerciais</Label>
                <Textarea
                  value={form.profileNotes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      profileNotes: e.target.value,
                    }))
                  }
                  placeholder="Perfil familiar, necessidade, contexto comercial..."
                  rows={3}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Observações internas</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Anotações internas do time"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenForm(false);
                  setEditingClient(null);
                  setForm(emptyForm);
                }}
              >
                Cancelar
              </Button>

              <Button
                onClick={handleSave}
                disabled={
                  createClientMutation.isPending || updateClientMutation.isPending
                }
              >
                {createClientMutation.isPending || updateClientMutation.isPending
                  ? "Salvando..."
                  : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={brokerDialogOpen} onOpenChange={setBrokerDialogOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Atribuir corretor</DialogTitle>
            <DialogDescription>
              Vincule ou remova o corretor responsável por este cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="rounded-md border p-3 text-sm">
              <div>
                <strong>Cliente:</strong> {selectedClient?.fullName || "-"}
              </div>
              <div className="mt-1 text-muted-foreground">
                Empreendimento: {selectedClient?.projectName || "-"}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Corretor</Label>
              <Select
                value={selectedBrokerId}
                onValueChange={setSelectedBrokerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um corretor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Sem corretor</SelectItem>
                  {loadingBrokers ? null : activeBrokers.length === 0 ? (
                    <SelectItem value="EMPTY_DISABLED" disabled>
                      Nenhum corretor ativo disponível
                    </SelectItem>
                  ) : (
                    activeBrokers.map((broker) => (
                      <SelectItem key={broker.id} value={broker.id}>
                        {broker.name}
                        {broker.billingEntityName
                          ? ` • ${broker.billingEntityName}`
                          : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setBrokerDialogOpen(false);
                  setSelectedClient(null);
                  setSelectedBrokerId("NONE");
                }}
              >
                Cancelar
              </Button>

              <Button
                onClick={handleSaveBroker}
                disabled={assignBrokerMutation.isPending}
                className="gap-2"
              >
                <BriefcaseBusiness className="h-4 w-4" />
                {assignBrokerMutation.isPending ? "Salvando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}