import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Search,
  UserRound,
  Phone,
  Mail,
  MapPin,
  Building2,
  ArrowRightLeft,
  CheckCircle2,
  Clock3,
  Filter,
  BriefcaseBusiness,
  UserCheck,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type PreAtendimentoItem = {
  id: string;
  project_id?: string | null;
  project_name?: string | null;
  source?: string | null;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  city_interest?: string | null;
  objective?: string | null;
  budget_range?: string | null;
  timeline?: string | null;
  family_profile?: string | null;
  notes?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
};

type BrokerItem = {
  id: string;
  name: string;
  isActive: boolean;
  billingEntityName?: string | null;
};

export default function PreAtendimentosPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedInterest, setSelectedInterest] =
    useState<PreAtendimentoItem | null>(null);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("NONE");

  const { data: preAtendimentos = [], isLoading } = useQuery<
    PreAtendimentoItem[]
  >({
    queryKey: ["/api/public/interests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/public/interests");
      return await response.json();
    },
  });

  const { data: brokers = [], isLoading: brokersLoading } = useQuery<
    BrokerItem[]
  >({
    queryKey: ["/api/admin/brokers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/brokers");
      return await response.json();
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (interestId: string) => {
      const response = await apiRequest(
        "POST",
        "/api/admin/interests/convert-to-client",
        {
          interestId,
        },
      );
      return await response.json();
    },
    onSuccess: async (data: any) => {
      toast({
        title: "Pré-atendimento convertido",
        description:
          data?.message || "O pré-atendimento foi convertido em cliente.",
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/public/interests"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
    },
    onError: async (error: any) => {
      let message =
        error?.message ||
        "Não foi possível converter o pré-atendimento em cliente.";

      try {
        if (error?.response?.json) {
          const data = await error.response.json();
          message = data?.message || message;
        }
      } catch {}

      toast({
        title: "Erro ao converter",
        description: message,
        variant: "destructive",
      });
    },
  });

  const convertAndAssignMutation = useMutation({
    mutationFn: async ({
      interestId,
      brokerId,
    }: {
      interestId: string;
      brokerId: string;
    }) => {
      const convertResponse = await apiRequest(
        "POST",
        "/api/admin/interests/convert-to-client",
        {
          interestId,
        },
      );
      const convertData = await convertResponse.json();

      const clientId = convertData?.clientId;
      if (!clientId) {
        throw new Error("Cliente não retornado na conversão.");
      }

      const assignResponse = await apiRequest(
        "PATCH",
        `/api/admin/clients/${clientId}/assign-broker`,
        {
          brokerId,
        },
      );
      const assignData = await assignResponse.json();

      return {
        convertData,
        assignData,
      };
    },
    onSuccess: async (data: any) => {
      toast({
        title: "Cliente convertido e corretor atribuído",
        description:
          data?.assignData?.message ||
          "A conversão e a atribuição foram concluídas com sucesso.",
      });

      setOpenAssignDialog(false);
      setSelectedInterest(null);
      setSelectedBrokerId("NONE");

      await queryClient.invalidateQueries({ queryKey: ["/api/public/interests"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
    },
    onError: async (error: any) => {
      let message =
        error?.message ||
        "Não foi possível converter e atribuir o corretor.";

      try {
        if (error?.response?.json) {
          const data = await error.response.json();
          message = data?.message || message;
        }
      } catch {}

      toast({
        title: "Erro no processo",
        description: message,
        variant: "destructive",
      });
    },
  });

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    let base = preAtendimentos;

    if (statusFilter !== "all") {
      base = base.filter(
        (item) => (item.status || "").toLowerCase() === statusFilter,
      );
    }

    if (!term) return base;

    return base.filter((item) => {
      const text = [
        item.full_name,
        item.phone,
        item.email,
        item.city_interest,
        item.project_name,
        item.objective,
        item.budget_range,
        item.timeline,
        item.family_profile,
        item.notes,
        item.status,
        item.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [preAtendimentos, search, statusFilter]);

  const activeBrokers = useMemo(() => {
    return brokers.filter((item) => item.isActive);
  }, [brokers]);

  function handleConvert(item: PreAtendimentoItem) {
    const ok = window.confirm(
      `Deseja converter "${item.full_name}" em cliente?`,
    );

    if (!ok) return;
    convertMutation.mutate(item.id);
  }

  function openConvertAndAssignDialog(item: PreAtendimentoItem) {
    setSelectedInterest(item);
    setSelectedBrokerId("NONE");
    setOpenAssignDialog(true);
  }

  function handleConvertAndAssign() {
    if (!selectedInterest) return;

    if (selectedBrokerId === "NONE") {
      toast({
        title: "Selecione um corretor",
        description: "Escolha o corretor antes de concluir a operação.",
        variant: "destructive",
      });
      return;
    }

    convertAndAssignMutation.mutate({
      interestId: selectedInterest.id,
      brokerId: selectedBrokerId,
    });
  }

  const total = preAtendimentos.length;
  const convertedCount = preAtendimentos.filter(
    (item) => item.status === "converted_client",
  ).length;
  const openCount = total - convertedCount;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Total de pré-atendimentos</CardDescription>
            <CardTitle className="text-3xl">{total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <UserRound className="h-4 w-4" />
              Entrada comercial
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Abertos</CardDescription>
            <CardTitle className="text-3xl">{openCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock3 className="h-4 w-4" />
              Pendentes de conversão
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription>Convertidos</CardDescription>
            <CardTitle className="text-3xl">{convertedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Já viraram clientes
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Pré-atendimentos</CardTitle>
            <CardDescription>
              Leads recebidos pelo sistema, com opção de converter em cliente e
              já vincular corretor no mesmo fluxo.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[280px]">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome, telefone, e-mail, cidade, empreendimento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="min-w-[190px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="new">Novos</SelectItem>
                  <SelectItem value="converted_client">Convertidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              Carregando pré-atendimentos...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              Nenhum pré-atendimento encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contato</TableHead>
                    <TableHead>Empreendimento</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredItems.map((item) => {
                    const isConverted = item.status === "converted_client";

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.full_name}</div>
                          <div className="mt-1 space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{item.phone || "-"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{item.email || "-"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{item.city_interest || "-"}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{item.project_name || "-"}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Origem: {item.source || "-"}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div>{item.objective || "-"}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.budget_range || "-"} • {item.timeline || "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.family_profile || item.notes || "Sem observações"}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {isConverted ? (
                            <Badge>Convertido</Badge>
                          ) : (
                            <Badge variant="secondary">Novo</Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              variant={isConverted ? "outline" : "default"}
                              size="sm"
                              className="gap-2"
                              disabled={isConverted || convertMutation.isPending}
                              onClick={() => handleConvert(item)}
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                              {isConverted ? "Já convertido" : "Converter"}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              disabled={isConverted || convertAndAssignMutation.isPending}
                              onClick={() => openConvertAndAssignDialog(item)}
                            >
                              <BriefcaseBusiness className="h-4 w-4" />
                              Converter + corretor
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openAssignDialog} onOpenChange={setOpenAssignDialog}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Converter e atribuir corretor</DialogTitle>
            <DialogDescription>
              O pré-atendimento será convertido em cliente e o corretor será
              vinculado em seguida.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="rounded-md border p-3 text-sm">
              <div>
                <strong>Contato:</strong> {selectedInterest?.full_name || "-"}
              </div>
              <div className="mt-1 text-muted-foreground">
                Empreendimento: {selectedInterest?.project_name || "-"}
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
                  <SelectItem value="NONE">Selecione...</SelectItem>
                  {brokersLoading ? null : activeBrokers.length === 0 ? (
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
                  setOpenAssignDialog(false);
                  setSelectedInterest(null);
                  setSelectedBrokerId("NONE");
                }}
              >
                Cancelar
              </Button>

              <Button
                onClick={handleConvertAndAssign}
                disabled={convertAndAssignMutation.isPending}
                className="gap-2"
              >
                <UserCheck className="h-4 w-4" />
                {convertAndAssignMutation.isPending
                  ? "Processando..."
                  : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}