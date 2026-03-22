import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Landmark,
  MessageSquareMore,
  Plus,
  DatabaseZap,
  Phone,
  Mail,
  CalendarDays,
  UserPlus,
  Pencil,
  FileText,
  Image as ImageIcon,
  Eye,
  Trash2,
  Users,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DbStatus = {
  configured: boolean;
  connected: boolean;
  mode: string;
  message: string;
};

type BillingEntity = {
  id: string;
  corporateName: string;
  tradeName?: string | null;
  document: string;
  bankCode?: string | null;
  bankName?: string | null;
  agency?: string | null;
  accountNumber?: string | null;
  walletCode?: string | null;
  agreementCode?: string | null;
  cnabLayout?: string | null;
  beneficiaryName?: string | null;
  beneficiaryDocument?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

type Development = {
  id: string;
  billingEntityId?: string | null;
  billingEntityName?: string | null;
  name: string;
  city: string;
  type: string;
  price: string;
  img: string;
  status: string;
  area: string;
  financing: string;
  description: string;
  highlights: string[];
  totalLots: number;
  plantPdfUrl?: string | null;
  plantImageUrl?: string | null;
  overviewImageUrl?: string | null;
};

type PublicInterest = {
  id: string;
  project_name?: string;
  projectName?: string;
  full_name?: string;
  fullName?: string;
  phone: string;
  email?: string | null;
  city_interest?: string | null;
  cityInterest?: string | null;
  objective?: string | null;
  budget_range?: string | null;
  budgetRange?: string | null;
  timeline?: string | null;
  family_profile?: string | null;
  familyProfile?: string | null;
  status: string;
  created_at?: string;
  createdAt?: string;
};


type SystemUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "admin" | "manager" | "broker" | "financial";
  isActive: boolean;
  isBootstrap?: boolean;
  billingEntityId?: string | null;
  billingEntityName?: string | null;
  developmentId?: string | null;
  developmentName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const initialBillingForm = {
  id: "",
  corporateName: "",
  tradeName: "",
  document: "",
  bankCode: "",
  bankName: "",
  agency: "",
  accountNumber: "",
  walletCode: "",
  agreementCode: "",
  cnabLayout: "CNAB240",
  beneficiaryName: "",
  beneficiaryDocument: "",
  notes: "",
};

const initialDevelopmentForm = {
  id: "",
  billingEntityId: "",
  name: "",
  city: "",
  type: "",
  price: "",
  img: "",
  status: "",
  area: "",
  financing: "",
  description: "",
  highlightsText: "",
  totalLots: "",
  plantPdfUrl: "",
  plantImageUrl: "",
  overviewImageUrl: "",
};


const initialUserForm = {
  id: "",
  name: "",
  username: "",
  email: "",
  role: "manager" as "admin" | "manager" | "broker" | "financial",
  billingEntityId: "NONE",
  developmentId: "NONE",
  isActive: true,
  password: "",
};

const initialPasswordForm = {
  userId: "",
  userLabel: "",
  password: "",
};

function getRoleBadgeLabel(role: SystemUser["role"]) {
  switch (role) {
    case "admin":
      return "Administrador master";
    case "manager":
      return "Admin empreendimento";
    case "broker":
      return "Corretor";
    default:
      return "Financeiro";
  }
}

function getDevelopmentCardImage(development: Development) {
  return (
    development.overviewImageUrl ||
    development.img ||
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2064&auto=format&fit=crop"
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("users");

  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [billingForm, setBillingForm] = useState(initialBillingForm);
  const [isEditingBilling, setIsEditingBilling] = useState(false);

  const [developmentDialogOpen, setDevelopmentDialogOpen] = useState(false);
  const [developmentForm, setDevelopmentForm] = useState(initialDevelopmentForm);
  const [isEditingDevelopment, setIsEditingDevelopment] = useState(false);

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userPasswordDialogOpen, setUserPasswordDialogOpen] = useState(false);
  const [userForm, setUserForm] = useState(initialUserForm);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [isEditingUser, setIsEditingUser] = useState(false);

  const { data: dbStatus } = useQuery<DbStatus>({
    queryKey: ["/api/system/db-status"],
    retry: false,
  });

  const { data: billingEntities = [] } = useQuery<BillingEntity[]>({
    queryKey: ["/api/admin/billing-entities"],
    retry: false,
  });

  const { data: developments = [] } = useQuery<Development[]>({
    queryKey: ["/api/admin/developments"],
    retry: false,
  });

  const { data: systemUsers = [] } = useQuery<SystemUser[]>({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  const { data: interests = [] } = useQuery<PublicInterest[]>({
    queryKey: ["/api/public/interests"],
    retry: false,
  });


  function resetUserForm() {
    setUserForm(initialUserForm);
    setIsEditingUser(false);
  }

  function openNewUserDialog() {
    resetUserForm();
    setUserDialogOpen(true);
  }

  function openEditUserDialog(user: SystemUser) {
    setIsEditingUser(true);
    setUserForm({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      billingEntityId: user.billingEntityId || "NONE",
      developmentId: user.developmentId || "NONE",
      isActive: user.isActive,
      password: "",
    });
    setUserDialogOpen(true);
  }

  function openPasswordDialog(user: SystemUser) {
    setPasswordForm({
      userId: user.id,
      userLabel: user.name,
      password: "",
    });
    setUserPasswordDialogOpen(true);
  }

  function resetBillingForm() {
    setBillingForm(initialBillingForm);
    setIsEditingBilling(false);
  }

  function openNewBillingDialog() {
    resetBillingForm();
    setBillingDialogOpen(true);
  }

  function openEditBillingDialog(entity: BillingEntity) {
    setIsEditingBilling(true);
    setBillingForm({
      id: entity.id,
      corporateName: entity.corporateName || "",
      tradeName: entity.tradeName || "",
      document: entity.document || "",
      bankCode: entity.bankCode || "",
      bankName: entity.bankName || "",
      agency: entity.agency || "",
      accountNumber: entity.accountNumber || "",
      walletCode: entity.walletCode || "",
      agreementCode: entity.agreementCode || "",
      cnabLayout: entity.cnabLayout || "CNAB240",
      beneficiaryName: entity.beneficiaryName || "",
      beneficiaryDocument: entity.beneficiaryDocument || "",
      notes: entity.notes || "",
    });
    setBillingDialogOpen(true);
  }

  const createBillingEntity = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/billing-entities", {
        corporateName: billingForm.corporateName,
        tradeName: billingForm.tradeName || null,
        document: billingForm.document,
        bankCode: billingForm.bankCode || null,
        bankName: billingForm.bankName || null,
        agency: billingForm.agency || null,
        accountNumber: billingForm.accountNumber || null,
        walletCode: billingForm.walletCode || null,
        agreementCode: billingForm.agreementCode || null,
        cnabLayout: billingForm.cnabLayout,
        beneficiaryName: billingForm.beneficiaryName || null,
        beneficiaryDocument: billingForm.beneficiaryDocument || null,
        notes: billingForm.notes || null,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entidade cobradora cadastrada",
        description: "Agora você já pode vincular empreendimentos a esse CNPJ.",
      });
      resetBillingForm();
      setBillingDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/billing-entities"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao cadastrar entidade",
        description:
          error instanceof Error
            ? error.message.replace(/^\d+:\s*/, "")
            : "Falha inesperada.",
        variant: "destructive",
      });
    },
  });

  const updateBillingEntity = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/billing-entities/${billingForm.id}`,
        {
          corporateName: billingForm.corporateName,
          tradeName: billingForm.tradeName || null,
          document: billingForm.document,
          bankCode: billingForm.bankCode || null,
          bankName: billingForm.bankName || null,
          agency: billingForm.agency || null,
          accountNumber: billingForm.accountNumber || null,
          walletCode: billingForm.walletCode || null,
          agreementCode: billingForm.agreementCode || null,
          cnabLayout: billingForm.cnabLayout,
          beneficiaryName: billingForm.beneficiaryName || null,
          beneficiaryDocument: billingForm.beneficiaryDocument || null,
          notes: billingForm.notes || null,
        },
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entidade atualizada",
        description: "Os dados bancários e cadastrais foram atualizados.",
      });
      resetBillingForm();
      setBillingDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/billing-entities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/developments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/developments"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar entidade",
        description:
          error instanceof Error
            ? error.message.replace(/^\d+:\s*/, "")
            : "Falha inesperada.",
        variant: "destructive",
      });
    },
  });

  const deleteBillingEntity = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/billing-entities/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entidade excluída",
        description: "A entidade cobradora foi removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/billing-entities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/developments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/developments"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir entidade",
        description:
          error instanceof Error
            ? error.message.replace(/^\d+:\s*/, "")
            : "Não foi possível excluir. Verifique se há vínculos com empreendimentos, vendas ou financeiro.",
        variant: "destructive",
      });
    },
  });

  const createDevelopment = useMutation({
    mutationFn: async () => {
      const highlights = developmentForm.highlightsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      const response = await apiRequest("POST", "/api/admin/developments", {
        billingEntityId: developmentForm.billingEntityId,
        name: developmentForm.name,
        city: developmentForm.city,
        type: developmentForm.type,
        price: developmentForm.price,
        img: developmentForm.img,
        status: developmentForm.status,
        area: developmentForm.area,
        financing: developmentForm.financing,
        description: developmentForm.description,
        highlights,
        totalLots: Number(developmentForm.totalLots || 0),
        plantPdfUrl: developmentForm.plantPdfUrl || null,
        plantImageUrl: developmentForm.plantImageUrl || null,
        overviewImageUrl: developmentForm.overviewImageUrl || null,
      });

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Empreendimento cadastrado",
        description: "O empreendimento já pode aparecer na landing pública.",
      });
      setDevelopmentForm(initialDevelopmentForm);
      setDevelopmentDialogOpen(false);
      setIsEditingDevelopment(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/developments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/developments"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao cadastrar empreendimento",
        description:
          error instanceof Error
            ? error.message.replace(/^\d+:\s*/, "")
            : "Falha inesperada.",
        variant: "destructive",
      });
    },
  });

  const updateDevelopment = useMutation({
    mutationFn: async () => {
      const highlights = developmentForm.highlightsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      const response = await apiRequest(
        "PUT",
        `/api/admin/developments/${developmentForm.id}`,
        {
          billingEntityId: developmentForm.billingEntityId,
          name: developmentForm.name,
          city: developmentForm.city,
          type: developmentForm.type,
          price: developmentForm.price,
          img: developmentForm.img,
          status: developmentForm.status,
          area: developmentForm.area,
          financing: developmentForm.financing,
          description: developmentForm.description,
          highlights,
          totalLots: Number(developmentForm.totalLots || 0),
          plantPdfUrl: developmentForm.plantPdfUrl || null,
          plantImageUrl: developmentForm.plantImageUrl || null,
          overviewImageUrl: developmentForm.overviewImageUrl || null,
        },
      );

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Empreendimento atualizado",
        description: "Os dados e documentos do empreendimento foram atualizados.",
      });
      setDevelopmentForm(initialDevelopmentForm);
      setDevelopmentDialogOpen(false);
      setIsEditingDevelopment(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/developments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/developments"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar empreendimento",
        description:
          error instanceof Error
            ? error.message.replace(/^\d+:\s*/, "")
            : "Falha inesperada.",
        variant: "destructive",
      });
    },
  });

  const convertInterestToClient = useMutation({
    mutationFn: async (interestId: string) => {
      const response = await apiRequest("POST", "/api/admin/interests/convert-to-client", {
        interestId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cliente criado com sucesso",
        description:
          "O pré-atendimento foi convertido e já aparece no módulo Clientes.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/public/interests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
    },
    onError: (error) => {
      toast({
        title: "Erro na conversão",
        description:
          error instanceof Error
            ? error.message.replace(/^\d+:\s*/, "")
            : "Falha inesperada.",
        variant: "destructive",
      });
    },
  });

  const createSystemUser = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/users", {
        name: userForm.name,
        username: userForm.username,
        email: userForm.email,
        role: userForm.role,
        password: userForm.password,
        isActive: userForm.isActive,
        billingEntityId:
          userForm.role === "admin"
            ? null
            : userForm.billingEntityId === "NONE"
              ? null
              : userForm.billingEntityId,
        developmentId:
          userForm.role === "admin"
            ? null
            : userForm.developmentId === "NONE"
              ? null
              : userForm.developmentId,
      });
      return response.json();
    },
    onSuccess: (payload: any) => {
      toast({
        title: "Usuário cadastrado",
        description:
          payload?.message ||
          "O usuário foi criado e já pode acessar o sistema.",
      });
      resetUserForm();
      setUserDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao cadastrar usuário",
        description:
          error instanceof Error
            ? error.message.replace(/^\d+:\s*/, "")
            : "Falha inesperada.",
        variant: "destructive",
      });
    },
  });

  const updateSystemUser = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userForm.id}`, {
        name: userForm.name,
        username: userForm.username,
        email: userForm.email,
        role: userForm.role,
        isActive: userForm.isActive,
        billingEntityId:
          userForm.role === "admin"
            ? null
            : userForm.billingEntityId === "NONE"
              ? null
              : userForm.billingEntityId,
        developmentId:
          userForm.role === "admin"
            ? null
            : userForm.developmentId === "NONE"
              ? null
              : userForm.developmentId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado",
        description: "Os dados e o escopo do usuário foram atualizados.",
      });
      resetUserForm();
      setUserDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description:
          error instanceof Error
            ? error.message.replace(/^\d+:\s*/, "")
            : "Falha inesperada.",
        variant: "destructive",
      });
    },
  });

  const updateSystemUserPassword = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/users/${passwordForm.userId}/password`,
        { password: passwordForm.password },
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha atualizada",
        description: "A nova senha do usuário já está ativa.",
      });
      setUserPasswordDialogOpen(false);
      setPasswordForm(initialPasswordForm);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar senha",
        description:
          error instanceof Error
            ? error.message.replace(/^\d+:\s*/, "")
            : "Falha inesperada.",
        variant: "destructive",
      });
    },
  });

  const normalizedInterests = useMemo(
    () =>
      interests.map((item) => ({
        id: item.id,
        projectName: item.project_name ?? item.projectName ?? "-",
        fullName: item.full_name ?? item.fullName ?? "-",
        phone: item.phone ?? "-",
        email: item.email ?? "-",
        cityInterest: item.city_interest ?? item.cityInterest ?? "-",
        objective: item.objective ?? "-",
        budgetRange: item.budget_range ?? item.budgetRange ?? "-",
        timeline: item.timeline ?? "-",
        familyProfile: item.family_profile ?? item.familyProfile ?? "-",
        status: item.status ?? "new",
        createdAt: item.created_at ?? item.createdAt ?? "",
      })),
    [interests],
  );

  function resetDevelopmentForm() {
    setDevelopmentForm(initialDevelopmentForm);
    setIsEditingDevelopment(false);
  }

  function openNewDevelopmentDialog() {
    resetDevelopmentForm();
    setDevelopmentDialogOpen(true);
  }

  function openEditDevelopmentDialog(development: Development) {
    setIsEditingDevelopment(true);
    setDevelopmentForm({
      id: development.id,
      billingEntityId: development.billingEntityId ?? "",
      name: development.name,
      city: development.city,
      type: development.type,
      price: development.price,
      img: development.img,
      status: development.status,
      area: development.area,
      financing: development.financing,
      description: development.description,
      highlightsText: (development.highlights ?? []).join("\n"),
      totalLots: String(development.totalLots ?? 0),
      plantPdfUrl: development.plantPdfUrl ?? "",
      plantImageUrl: development.plantImageUrl ?? "",
      overviewImageUrl: development.overviewImageUrl ?? "",
    });
    setDevelopmentDialogOpen(true);
  }

  function handleDeleteBillingEntity(entity: BillingEntity) {
    const confirmed = window.confirm(
      `Deseja realmente excluir a entidade "${entity.tradeName || entity.corporateName}"?`,
    );

    if (!confirmed) return;

    deleteBillingEntity.mutate(entity.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Configurações Estruturais
          </h1>
          <p className="text-slate-500">
            Cadastre entidades cobradoras, empreendimentos e acompanhe os pré-atendimentos da IA.
          </p>
        </div>

        <Card className="w-full lg:w-auto">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-slate-100 flex items-center justify-center">
              <DatabaseZap className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                Banco de dados
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={
                    dbStatus?.connected
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }
                >
                  {dbStatus?.connected ? "Conectado" : "Fallback / memória"}
                </Badge>
                <span className="text-xs text-slate-500">{dbStatus?.message}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 w-full justify-start overflow-x-auto">
          <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-white">
            <Users className="w-4 h-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2 data-[state=active]:bg-white">
            <Landmark className="w-4 h-4" /> Entidades Cobradoras
          </TabsTrigger>
          <TabsTrigger value="developments" className="gap-2 data-[state=active]:bg-white">
            <Building2 className="w-4 h-4" /> Empreendimentos
          </TabsTrigger>
          <TabsTrigger value="ia" className="gap-2 data-[state=active]:bg-white">
            <MessageSquareMore className="w-4 h-4" /> Pré-atendimentos IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
              <div>
                <CardTitle>Usuários e escopo de acesso</CardTitle>
                <CardDescription>
                  Crie o administrador master, administradores por empreendimento e demais usuários operacionais.
                </CardDescription>
              </div>

              <div className="flex gap-2">
                <Dialog
                  open={userPasswordDialogOpen}
                  onOpenChange={(open) => {
                    setUserPasswordDialogOpen(open);
                    if (!open) setPasswordForm(initialPasswordForm);
                  }}
                >
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Trocar senha do usuário</DialogTitle>
                      <DialogDescription>
                        Defina uma nova senha para {passwordForm.userLabel || "o usuário selecionado"}.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nova senha</Label>
                        <Input
                          type="password"
                          value={passwordForm.password}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          placeholder="Mínimo de 6 caracteres"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setUserPasswordDialogOpen(false);
                            setPasswordForm(initialPasswordForm);
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => updateSystemUserPassword.mutate()}
                          disabled={updateSystemUserPassword.isPending}
                        >
                          {updateSystemUserPassword.isPending ? "Salvando..." : "Salvar senha"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={userDialogOpen}
                  onOpenChange={(open) => {
                    setUserDialogOpen(open);
                    if (!open) resetUserForm();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={openNewUserDialog}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo usuário
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {isEditingUser ? "Editar usuário" : "Cadastrar usuário"}
                      </DialogTitle>
                      <DialogDescription>
                        O administrador master é global. O administrador de empreendimento deve ficar vinculado a um empreendimento específico.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                      Ao criar o primeiro <strong>admin master real</strong>, o usuário bootstrap inicial será desativado automaticamente.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label>Nome completo</Label>
                        <Input
                          value={userForm.name}
                          onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                          placeholder="Ex: João da Silva"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Login</Label>
                        <Input
                          value={userForm.username}
                          onChange={(e) =>
                            setUserForm({ ...userForm, username: e.target.value })
                          }
                          placeholder="Ex: joao.silva"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>E-mail</Label>
                        <Input
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          placeholder="usuario@empresa.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Perfil</Label>
                        <Select
                          value={userForm.role}
                          onValueChange={(value: any) =>
                            setUserForm((prev) => ({
                              ...prev,
                              role: value,
                              billingEntityId: value === "admin" ? "NONE" : prev.billingEntityId,
                              developmentId: value === "admin" ? "NONE" : prev.developmentId,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador master</SelectItem>
                            <SelectItem value="manager">Admin empreendimento</SelectItem>
                            <SelectItem value="broker">Corretor</SelectItem>
                            <SelectItem value="financial">Financeiro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {!isEditingUser ? (
                        <div className="space-y-2">
                          <Label>Senha inicial</Label>
                          <Input
                            type="password"
                            value={userForm.password}
                            onChange={(e) =>
                              setUserForm({ ...userForm, password: e.target.value })
                            }
                            placeholder="Mínimo de 6 caracteres"
                          />
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={userForm.isActive ? "active" : "inactive"}
                          onValueChange={(value) =>
                            setUserForm({
                              ...userForm,
                              isActive: value === "active",
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Empreendimento vinculado</Label>
                        <Select
                          value={userForm.role === "admin" ? "NONE" : userForm.developmentId}
                          onValueChange={(value) => {
                            const selected = developments.find((item) => item.id === value);
                            setUserForm((prev) => ({
                              ...prev,
                              developmentId: value,
                              billingEntityId: selected?.billingEntityId || prev.billingEntityId,
                            }));
                          }}
                          disabled={userForm.role === "admin"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o empreendimento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">Sem vínculo específico</SelectItem>
                            {developments.map((development) => (
                              <SelectItem key={development.id} value={development.id}>
                                {development.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Entidade cobradora</Label>
                        <Select
                          value={userForm.role === "admin" ? "NONE" : userForm.billingEntityId}
                          onValueChange={(value) =>
                            setUserForm((prev) => ({
                              ...prev,
                              billingEntityId: value,
                            }))
                          }
                          disabled={userForm.role === "admin"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a entidade cobradora" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">Sem vínculo específico</SelectItem>
                            {billingEntities.map((entity) => (
                              <SelectItem key={entity.id} value={entity.id}>
                                {entity.tradeName || entity.corporateName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setUserDialogOpen(false);
                          resetUserForm();
                        }}
                      >
                        Cancelar
                      </Button>

                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() =>
                          isEditingUser
                            ? updateSystemUser.mutate()
                            : createSystemUser.mutate()
                        }
                        disabled={createSystemUser.isPending || updateSystemUser.isPending}
                      >
                        {createSystemUser.isPending || updateSystemUser.isPending
                          ? "Salvando..."
                          : isEditingUser
                            ? "Salvar alterações"
                            : "Salvar usuário"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Total de usuários</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{systemUsers.length}</p>
                </div>
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Admins de empreendimento</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{systemUsers.filter((item) => item.role === "manager").length}</p>
                </div>
                <div className="rounded-2xl border bg-amber-50 border-amber-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">Bootstrap ativo</p>
                  <p className="mt-2 text-2xl font-black text-amber-700">{systemUsers.filter((item) => item.isBootstrap && item.isActive).length}</p>
                </div>
              </div>

              {systemUsers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                  Nenhum usuário cadastrado ainda.
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {systemUsers.map((user) => (
                    <Card key={user.id} className="border-slate-200 shadow-none">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-black text-slate-900">{user.name}</h3>
                            <p className="text-sm text-slate-500">{user.username} • {user.email}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}>
                              {user.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                            {user.isBootstrap ? (
                              <Badge className="bg-amber-100 text-amber-700">Bootstrap</Badge>
                            ) : null}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs uppercase text-slate-500 font-semibold">Perfil</p>
                            <p className="font-semibold text-slate-800">{getRoleBadgeLabel(user.role)}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs uppercase text-slate-500 font-semibold">Entidade cobradora</p>
                            <p className="font-semibold text-slate-800">{user.billingEntityName || "Global / não vinculada"}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                            <p className="text-xs uppercase text-slate-500 font-semibold">Empreendimento</p>
                            <p className="font-semibold text-slate-800">{user.developmentName || (user.role === "admin" ? "Acesso total do sistema" : "Sem vínculo específico")}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => openPasswordDialog(user)}
                          >
                            <KeyRound className="h-4 w-4" />
                            Trocar senha
                          </Button>

                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => openEditUserDialog(user)}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
              <div>
                <CardTitle>Entidades cobradoras</CardTitle>
                <CardDescription>
                  Cada loteamento pode operar com CNPJ, banco, carteira e convênio próprios.
                </CardDescription>
              </div>

              <Dialog
                open={billingDialogOpen}
                onOpenChange={(open) => {
                  setBillingDialogOpen(open);
                  if (!open) resetBillingForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={openNewBillingDialog}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova entidade
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditingBilling
                        ? "Editar entidade cobradora"
                        : "Cadastrar entidade cobradora"}
                    </DialogTitle>
                    <DialogDescription>
                      Esta entidade será usada como base financeira e bancária dos empreendimentos.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Razão social</Label>
                      <Input
                        value={billingForm.corporateName}
                        onChange={(e) =>
                          setBillingForm({ ...billingForm, corporateName: e.target.value })
                        }
                        placeholder="Ex: Loteadora Alpha SPE Ltda"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Nome fantasia</Label>
                      <Input
                        value={billingForm.tradeName}
                        onChange={(e) =>
                          setBillingForm({ ...billingForm, tradeName: e.target.value })
                        }
                        placeholder="Ex: Alpha Loteamentos"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>CNPJ</Label>
                      <Input
                        value={billingForm.document}
                        onChange={(e) =>
                          setBillingForm({ ...billingForm, document: e.target.value })
                        }
                        placeholder="00.000.000/0001-00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Layout CNAB</Label>
                      <Select
                        value={billingForm.cnabLayout}
                        onValueChange={(value) =>
                          setBillingForm({ ...billingForm, cnabLayout: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CNAB240">CNAB240</SelectItem>
                          <SelectItem value="CNAB400">CNAB400</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Código do banco</Label>
                      <Input
                        value={billingForm.bankCode}
                        onChange={(e) =>
                          setBillingForm({ ...billingForm, bankCode: e.target.value })
                        }
                        placeholder="756"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Nome do banco</Label>
                      <Input
                        value={billingForm.bankName}
                        onChange={(e) =>
                          setBillingForm({ ...billingForm, bankName: e.target.value })
                        }
                        placeholder="Sicoob"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Agência / cooperativa</Label>
                      <Input
                        value={billingForm.agency}
                        onChange={(e) =>
                          setBillingForm({ ...billingForm, agency: e.target.value })
                        }
                        placeholder="3045-7"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Conta</Label>
                      <Input
                        value={billingForm.accountNumber}
                        onChange={(e) =>
                          setBillingForm({ ...billingForm, accountNumber: e.target.value })
                        }
                        placeholder="Conta vinculada"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Carteira / modalidade</Label>
                      <Input
                        value={billingForm.walletCode}
                        onChange={(e) =>
                          setBillingForm({ ...billingForm, walletCode: e.target.value })
                        }
                        placeholder="1/01"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Convênio / código beneficiário</Label>
                      <Input
                        value={billingForm.agreementCode}
                        onChange={(e) =>
                          setBillingForm({ ...billingForm, agreementCode: e.target.value })
                        }
                        placeholder="Código do convênio"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Beneficiário</Label>
                      <Input
                        value={billingForm.beneficiaryName}
                        onChange={(e) =>
                          setBillingForm({ ...billingForm, beneficiaryName: e.target.value })
                        }
                        placeholder="Nome do beneficiário"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Documento do beneficiário</Label>
                      <Input
                        value={billingForm.beneficiaryDocument}
                        onChange={(e) =>
                          setBillingForm({
                            ...billingForm,
                            beneficiaryDocument: e.target.value,
                          })
                        }
                        placeholder="CNPJ do beneficiário"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label>Observações bancárias</Label>
                    <Textarea
                      value={billingForm.notes}
                      onChange={(e) => setBillingForm({ ...billingForm, notes: e.target.value })}
                      placeholder="Informações úteis sobre cobrança, carteira, homologação, remessa, retorno..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setBillingDialogOpen(false);
                        resetBillingForm();
                      }}
                    >
                      Cancelar
                    </Button>

                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() =>
                        isEditingBilling
                          ? updateBillingEntity.mutate()
                          : createBillingEntity.mutate()
                      }
                      disabled={
                        createBillingEntity.isPending || updateBillingEntity.isPending
                      }
                    >
                      {createBillingEntity.isPending || updateBillingEntity.isPending
                        ? "Salvando..."
                        : isEditingBilling
                          ? "Salvar alterações"
                          : "Salvar entidade"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent className="p-6">
              {billingEntities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                  Nenhuma entidade cobradora cadastrada ainda.
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {billingEntities.map((entity) => (
                    <Card key={entity.id} className="border-slate-200 shadow-none">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-black text-slate-900">
                              {entity.tradeName || entity.corporateName}
                            </h3>
                            <p className="text-sm text-slate-500">{entity.corporateName}</p>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700">
                            {entity.cnabLayout || "CNAB240"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs uppercase text-slate-500 font-semibold">CNPJ</p>
                            <p className="font-semibold text-slate-800">{entity.document}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs uppercase text-slate-500 font-semibold">Banco</p>
                            <p className="font-semibold text-slate-800">
                              {entity.bankCode || "-"}{" "}
                              {entity.bankName ? `- ${entity.bankName}` : ""}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs uppercase text-slate-500 font-semibold">
                              Agência / conta
                            </p>
                            <p className="font-semibold text-slate-800">
                              {entity.agency || "-"} / {entity.accountNumber || "-"}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs uppercase text-slate-500 font-semibold">
                              Carteira / convênio
                            </p>
                            <p className="font-semibold text-slate-800">
                              {entity.walletCode || "-"} / {entity.agreementCode || "-"}
                            </p>
                          </div>
                        </div>

                        {entity.notes ? (
                          <div className="rounded-xl border border-slate-200 p-3 text-sm text-slate-600">
                            {entity.notes}
                          </div>
                        ) : null}

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => openEditBillingDialog(entity)}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>

                          <Button
                            variant="destructive"
                            className="gap-2"
                            onClick={() => handleDeleteBillingEntity(entity)}
                            disabled={deleteBillingEntity.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="developments" className="space-y-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
              <div>
                <CardTitle>Empreendimentos</CardTitle>
                <CardDescription>
                  Cadastre empreendimentos reais, vincule à entidade cobradora e informe os documentos da planta.
                </CardDescription>
              </div>

              <Dialog
                open={developmentDialogOpen}
                onOpenChange={(open) => {
                  setDevelopmentDialogOpen(open);
                  if (!open) resetDevelopmentForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={billingEntities.length === 0}
                    onClick={openNewDevelopmentDialog}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo empreendimento
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditingDevelopment
                        ? "Editar empreendimento"
                        : "Cadastrar empreendimento"}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os dados comerciais e os caminhos dos arquivos visuais do loteamento.
                    </DialogDescription>
                  </DialogHeader>

                  {billingEntities.length === 0 ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                      Cadastre primeiro uma entidade cobradora para vincular o empreendimento.
                    </div>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 mb-4">
                        <p className="font-semibold mb-2">
                          Importante sobre as imagens
                        </p>
                        <p>
                          Use caminhos públicos do app, por exemplo:
                        </p>
                        <div className="mt-2 space-y-1 text-xs break-all">
                          <p>/uploads/empreendimentos/residencial-portal-do-prado/planta-loteamento.pdf</p>
                          <p>/uploads/empreendimentos/residencial-portal-do-prado/planta-loteamento.jpg</p>
                          <p>/uploads/empreendimentos/residencial-portal-do-prado/perspectiva-loteamento.jpg</p>
                        </div>
                        <p className="mt-2">
                          Não use caminho local do Windows como <strong>d:\...</strong>, porque o navegador não consegue carregar.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Entidade cobradora</Label>
                          <Select
                            value={developmentForm.billingEntityId}
                            onValueChange={(value) =>
                              setDevelopmentForm({ ...developmentForm, billingEntityId: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a entidade" />
                            </SelectTrigger>
                            <SelectContent>
                              {billingEntities.map((entity) => (
                                <SelectItem key={entity.id} value={entity.id}>
                                  {entity.tradeName || entity.corporateName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Nome do empreendimento</Label>
                          <Input
                            value={developmentForm.name}
                            onChange={(e) =>
                              setDevelopmentForm({ ...developmentForm, name: e.target.value })
                            }
                            placeholder="Ex: Residencial Portal do Prado"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Cidade / UF</Label>
                          <Input
                            value={developmentForm.city}
                            onChange={(e) =>
                              setDevelopmentForm({ ...developmentForm, city: e.target.value })
                            }
                            placeholder="Ex: Prado/BA"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Input
                            value={developmentForm.type}
                            onChange={(e) =>
                              setDevelopmentForm({ ...developmentForm, type: e.target.value })
                            }
                            placeholder="Ex: Loteamento aberto"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Preço / condição comercial</Label>
                          <Input
                            value={developmentForm.price}
                            onChange={(e) =>
                              setDevelopmentForm({ ...developmentForm, price: e.target.value })
                            }
                            placeholder="Ex: A partir de R$ 95.000"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Input
                            value={developmentForm.status}
                            onChange={(e) =>
                              setDevelopmentForm({ ...developmentForm, status: e.target.value })
                            }
                            placeholder="Ex: Lançamento"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Área / dimensão</Label>
                          <Input
                            value={developmentForm.area}
                            onChange={(e) =>
                              setDevelopmentForm({ ...developmentForm, area: e.target.value })
                            }
                            placeholder="Ex: Lotes a partir de 200 m²"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Total de lotes</Label>
                          <Input
                            type="number"
                            value={developmentForm.totalLots}
                            onChange={(e) =>
                              setDevelopmentForm({
                                ...developmentForm,
                                totalLots: e.target.value,
                              })
                            }
                            placeholder="Ex: 180"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Imagem principal (URL pública)</Label>
                          <Input
                            value={developmentForm.img}
                            onChange={(e) =>
                              setDevelopmentForm({ ...developmentForm, img: e.target.value })
                            }
                            placeholder="/uploads/empreendimentos/residencial-portal-do-prado/perspectiva-loteamento.jpg"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Planta em PDF</Label>
                          <Input
                            value={developmentForm.plantPdfUrl}
                            onChange={(e) =>
                              setDevelopmentForm({
                                ...developmentForm,
                                plantPdfUrl: e.target.value,
                              })
                            }
                            placeholder="/uploads/empreendimentos/residencial-portal-do-prado/planta-loteamento.pdf"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Planta em imagem (JPG/PNG)</Label>
                          <Input
                            value={developmentForm.plantImageUrl}
                            onChange={(e) =>
                              setDevelopmentForm({
                                ...developmentForm,
                                plantImageUrl: e.target.value,
                              })
                            }
                            placeholder="/uploads/empreendimentos/residencial-portal-do-prado/planta-loteamento.jpg"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Imagem de perspectiva / ilustrativa</Label>
                          <Input
                            value={developmentForm.overviewImageUrl}
                            onChange={(e) =>
                              setDevelopmentForm({
                                ...developmentForm,
                                overviewImageUrl: e.target.value,
                              })
                            }
                            placeholder="/uploads/empreendimentos/residencial-portal-do-prado/perspectiva-loteamento.jpg"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Financiamento / condição</Label>
                          <Input
                            value={developmentForm.financing}
                            onChange={(e) =>
                              setDevelopmentForm({
                                ...developmentForm,
                                financing: e.target.value,
                              })
                            }
                            placeholder="Ex: Entrada facilitada + parcelamento direto"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Descrição</Label>
                          <Textarea
                            value={developmentForm.description}
                            onChange={(e) =>
                              setDevelopmentForm({
                                ...developmentForm,
                                description: e.target.value,
                              })
                            }
                            placeholder="Descrição comercial e estratégica do empreendimento"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Diferenciais (um por linha)</Label>
                          <Textarea
                            value={developmentForm.highlightsText}
                            onChange={(e) =>
                              setDevelopmentForm({
                                ...developmentForm,
                                highlightsText: e.target.value,
                              })
                            }
                            placeholder={`Ex: Portaria 24h\nÁrea verde planejada\nAlta valorização`}
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mt-4">
                        <p className="text-sm font-semibold text-slate-800 mb-3">
                          Pré-visualização dos arquivos
                        </p>

                        <div className="grid grid-cols-1 gap-2 text-xs text-slate-600">
                          <p>
                            <strong>Imagem principal:</strong>{" "}
                            {developmentForm.img || "-"}
                          </p>
                          <p>
                            <strong>Planta PDF:</strong>{" "}
                            {developmentForm.plantPdfUrl || "-"}
                          </p>
                          <p>
                            <strong>Planta imagem:</strong>{" "}
                            {developmentForm.plantImageUrl || "-"}
                          </p>
                          <p>
                            <strong>Perspectiva:</strong>{" "}
                            {developmentForm.overviewImageUrl || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDevelopmentDialogOpen(false);
                            resetDevelopmentForm();
                          }}
                        >
                          Cancelar
                        </Button>

                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() =>
                            isEditingDevelopment
                              ? updateDevelopment.mutate()
                              : createDevelopment.mutate()
                          }
                          disabled={
                            createDevelopment.isPending || updateDevelopment.isPending
                          }
                        >
                          {createDevelopment.isPending || updateDevelopment.isPending
                            ? "Salvando..."
                            : isEditingDevelopment
                              ? "Salvar alterações"
                              : "Salvar empreendimento"}
                        </Button>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent className="p-6">
              {developments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                  Nenhum empreendimento cadastrado ainda.
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {developments.map((development) => (
                    <Card key={development.id} className="overflow-hidden border-slate-200 shadow-none">
                      <div className="h-44 relative">
                        <img
                          src={getDevelopmentCardImage(development)}
                          alt={development.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent"></div>
                        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                          <Badge className="bg-white/90 text-slate-900 hover:bg-white">
                            {development.type}
                          </Badge>
                          <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
                            {development.status}
                          </Badge>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <p className="font-black text-xl">{development.name}</p>
                          <p className="text-sm text-slate-200">{development.city}</p>
                        </div>
                      </div>

                      <CardContent className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs uppercase text-slate-500 font-semibold">Preço</p>
                            <p className="font-bold text-slate-800">{development.price}</p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs uppercase text-slate-500 font-semibold">
                              Total de lotes
                            </p>
                            <p className="font-bold text-slate-800">{development.totalLots}</p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3 col-span-2">
                            <p className="text-xs uppercase text-slate-500 font-semibold">
                              Entidade cobradora
                            </p>
                            <p className="font-bold text-slate-800">
                              {development.billingEntityName || "Não vinculada"}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 line-clamp-3">
                          {development.description}
                        </p>

                        <div className="grid grid-cols-1 gap-2">
                          {development.plantPdfUrl ? (
                            <a
                              href={development.plantPdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-700 hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              Abrir planta PDF
                            </a>
                          ) : null}

                          {development.plantImageUrl ? (
                            <a
                              href={development.plantImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-700 hover:underline"
                            >
                              <ImageIcon className="h-4 w-4" />
                              Abrir planta em imagem
                            </a>
                          ) : null}

                          {development.overviewImageUrl ? (
                            <a
                              href={development.overviewImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-700 hover:underline"
                            >
                              <Eye className="h-4 w-4" />
                              Abrir perspectiva ilustrativa
                            </a>
                          ) : null}
                        </div>

                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => openEditDevelopmentDialog(development)}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar empreendimento
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ia" className="space-y-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>Pré-atendimentos da IA</CardTitle>
              <CardDescription>
                Estes registros vieram da landing pública após a entrevista feita pela SmartIA.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {normalizedInterests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                  Nenhum pré-atendimento registrado ainda.
                </div>
              ) : (
                <div className="space-y-4">
                  {normalizedInterests.map((interest) => (
                    <Card key={interest.id} className="border-slate-200 shadow-none">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-black text-slate-900">
                                {interest.fullName}
                              </h3>
                              <Badge
                                className={
                                  interest.status === "converted_client"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-blue-100 text-blue-700"
                                }
                              >
                                {interest.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                              Interesse em: <strong>{interest.projectName}</strong>
                            </p>
                          </div>

                          <div className="text-sm text-slate-500 flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            {interest.createdAt
                              ? new Date(interest.createdAt).toLocaleString("pt-BR")
                              : "-"}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs uppercase text-slate-500 font-semibold flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" /> Telefone
                            </p>
                            <p className="font-semibold text-slate-800 mt-1">{interest.phone}</p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs uppercase text-slate-500 font-semibold flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" /> E-mail
                            </p>
                            <p className="font-semibold text-slate-800 mt-1 break-all">
                              {interest.email}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs uppercase text-slate-500 font-semibold">
                              Cidade / região
                            </p>
                            <p className="font-semibold text-slate-800 mt-1">
                              {interest.cityInterest}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs uppercase text-slate-500 font-semibold">
                              Prazo
                            </p>
                            <p className="font-semibold text-slate-800 mt-1">
                              {interest.timeline}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3 md:col-span-2">
                            <p className="text-xs uppercase text-slate-500 font-semibold">
                              Objetivo
                            </p>
                            <p className="font-semibold text-slate-800 mt-1">
                              {interest.objective}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3 md:col-span-2">
                            <p className="text-xs uppercase text-slate-500 font-semibold">
                              Faixa de investimento
                            </p>
                            <p className="font-semibold text-slate-800 mt-1">
                              {interest.budgetRange}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3 md:col-span-4">
                            <p className="text-xs uppercase text-slate-500 font-semibold">
                              Perfil informado à IA
                            </p>
                            <p className="font-semibold text-slate-800 mt-1">
                              {interest.familyProfile}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Button variant="outline">Atribuir corretor</Button>

                          <Button
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={
                              interest.status === "converted_client" ||
                              convertInterestToClient.isPending
                            }
                            onClick={() => convertInterestToClient.mutate(interest.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {interest.status === "converted_client"
                              ? "Já convertido em cliente"
                              : "Converter em cliente"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}