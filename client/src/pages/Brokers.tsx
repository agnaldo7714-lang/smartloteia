import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Building2,
  Mail,
  Phone,
  PlusCircle,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  Pencil,
  UserCircle2,
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
import { Switch } from "@/components/ui/switch";
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

type BillingEntityItem = {
  id: string;
  corporateName: string;
  tradeName?: string | null;
  document: string;
  isActive: boolean;
};

type BrokerItem = {
  id: string;
  billingEntityId: string;
  billingEntityName?: string | null;
  corporateName?: string | null;
  tradeName?: string | null;
  name: string;
  creci?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  isActive: boolean;
};

type BrokerFormState = {
  billingEntityId: string;
  name: string;
  creci: string;
  phone: string;
  email: string;
  notes: string;
  isActive: boolean;
};

const emptyForm: BrokerFormState = {
  billingEntityId: "",
  name: "",
  creci: "",
  phone: "",
  email: "",
  notes: "",
  isActive: true,
};

function getBrokerDisplayName(item: BrokerItem) {
  return item.name || "Corretor sem nome";
}

export default function BrokersPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editingBroker, setEditingBroker] = useState<BrokerItem | null>(null);
  const [form, setForm] = useState<BrokerFormState>(emptyForm);

  const { data: billingEntities = [], isLoading: loadingEntities } = useQuery<
    BillingEntityItem[]
  >({
    queryKey: ["/api/admin/billing-entities"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/billing-entities");
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

  const createBrokerMutation = useMutation({
    mutationFn: async (payload: BrokerFormState) => {
      const response = await apiRequest("POST", "/api/admin/brokers", {
        billingEntityId: payload.billingEntityId,
        name: payload.name.trim(),
        creci: payload.creci.trim() || null,
        phone: payload.phone.trim() || null,
        email: payload.email.trim() || null,
        notes: payload.notes.trim() || null,
      });
      return await response.json();
    },
    onSuccess: async () => {
      toast({ title: "Corretor cadastrado com sucesso" });
      setOpenForm(false);
      setEditingBroker(null);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar corretor",
        description: error?.message || "Não foi possível salvar o corretor.",
        variant: "destructive",
      });
    },
  });

  const updateBrokerMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: BrokerFormState;
    }) => {
      const response = await apiRequest("PUT", `/api/admin/brokers/${id}`, {
        billingEntityId: payload.billingEntityId,
        name: payload.name.trim(),
        creci: payload.creci.trim() || null,
        phone: payload.phone.trim() || null,
        email: payload.email.trim() || null,
        notes: payload.notes.trim() || null,
        isActive: payload.isActive,
      });
      return await response.json();
    },
    onSuccess: async () => {
      toast({ title: "Corretor atualizado com sucesso" });
      setOpenForm(false);
      setEditingBroker(null);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar corretor",
        description: error?.message || "Não foi possível atualizar o corretor.",
        variant: "destructive",
      });
    },
  });

  const deleteBrokerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/brokers/${id}`);
      return await response.json();
    },
    onSuccess: async (data: any) => {
      toast({
        title: "Operação concluída com sucesso",
        description:
          data?.message ||
          "O corretor foi removido ou inativado conforme o histórico.",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/brokers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir corretor",
        description: error?.message || "Não foi possível excluir o corretor.",
        variant: "destructive",
      });
    },
  });

  const filteredBrokers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return brokers;

    return brokers.filter((item) => {
      const text = [
        item.name,
        item.billingEntityName,
        item.corporateName,
        item.tradeName,
        item.creci,
        item.phone,
        item.email,
        item.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [brokers, search]);

  const activeBillingEntities = useMemo(() => {
    return billingEntities.filter((item) => item.isActive);
  }, [billingEntities]);

  function openCreateModal() {
    setEditingBroker(null);
    setForm(emptyForm);
    setOpenForm(true);
  }

  function openEditModal(item: BrokerItem) {
    setEditingBroker(item);
    setForm({
      billingEntityId: item.billingEntityId || "",
      name: item.name || "",
      creci: item.creci || "",
      phone: item.phone || "",
      email: item.email || "",
      notes: item.notes || "",
      isActive: item.isActive ?? true,
    });
    setOpenForm(true);
  }

  function resetAndClose() {
    setOpenForm(false);
    setEditingBroker(null);
    setForm(emptyForm);
  }

  function handleSave() {
    if (!form.billingEntityId) {
      toast({
        title: "Selecione a entidade do corretor",
        variant: "destructive",
      });
      return;
    }

    if (!form.name.trim()) {
      toast({
        title: "Informe o nome do corretor",
        variant: "destructive",
      });
      return;
    }

    if (editingBroker) {
      updateBrokerMutation.mutate({
        id: editingBroker.id,
        payload: form,
      });
      return;
    }

    createBrokerMutation.mutate(form);
  }

  function handleDelete(item: BrokerItem) {
    const ok = window.confirm(
      `Deseja realmente excluir/inativar o corretor "${getBrokerDisplayName(
        item
      )}"?`
    );

    if (!ok) return;
    deleteBrokerMutation.mutate(item.id);
  }

  const total = brokers.length;
  const activeCount = brokers.filter((item) => item.isActive).length;
  const inactiveCount = total - activeCount;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Total de corretores</CardDescription>
            <CardTitle className="text-3xl">{total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
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
              <ShieldCheck className="h-4 w-4" />
              Aptos para atuação
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
              Sem atuação atual
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Corretores</CardTitle>
            <CardDescription>
              Gerencie cadastro, edição e exclusão de corretores.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[280px]">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome, entidade, CRECI, telefone ou e-mail"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button onClick={openCreateModal} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Novo corretor
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loadingBrokers ? (
            <div className="py-10 text-center text-muted-foreground">
              Carregando corretores...
            </div>
          ) : filteredBrokers.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              Nenhum corretor encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Corretor</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>CRECI</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredBrokers.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                          <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                          {getBrokerDisplayName(item)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {item.billingEntityName ||
                            item.tradeName ||
                            item.corporateName ||
                            "-"}
                        </div>
                      </TableCell>

                      <TableCell>{item.creci || "-"}</TableCell>

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
                        {item.isActive ? (
                          <Badge>Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
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
                            disabled={deleteBrokerMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </Button>
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
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>
              {editingBroker ? "Editar corretor" : "Novo corretor"}
            </DialogTitle>
            <DialogDescription>
              {editingBroker
                ? "Atualize os dados do corretor."
                : "Cadastre um novo corretor para atuar no sistema."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Entidade / cadastro base</Label>
              <Select
                value={form.billingEntityId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, billingEntityId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a entidade" />
                </SelectTrigger>
                <SelectContent>
                  {loadingEntities ? null : activeBillingEntities.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      Nenhuma entidade disponível
                    </SelectItem>
                  ) : (
                    activeBillingEntities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.tradeName || entity.corporateName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome do corretor</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Informe o nome completo do corretor"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>CRECI</Label>
                <Input
                  value={form.creci}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, creci: e.target.value }))
                  }
                  placeholder="Informe o CRECI"
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                <Label>Status</Label>
                <div className="flex h-10 items-center justify-between rounded-md border px-3">
                  <span className="text-sm">
                    {form.isActive ? "Ativo" : "Inativo"}
                  </span>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Input
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Informações adicionais do corretor"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={resetAndClose}>
                Cancelar
              </Button>

              <Button
                onClick={handleSave}
                disabled={
                  createBrokerMutation.isPending || updateBrokerMutation.isPending
                }
              >
                {createBrokerMutation.isPending || updateBrokerMutation.isPending
                  ? "Salvando..."
                  : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}