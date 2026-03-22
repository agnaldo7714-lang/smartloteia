import { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { SafeUser } from "@shared/schema";
import {
  Download,
  FileSignature,
  CheckCircle2,
  Search,
  Filter,
  BadgeDollarSign,
  Lock,
  Building2,
  MapPin,
  Users,
  LoaderCircle,
  PlusCircle,
  Pencil,
  Eye,
  XCircle,
  Copy,
  MessageCircle,
  Trash2,
  Link as LinkIcon,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ClientItem = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  status: string;
};

type BrokerItem = {
  id: string;
  billingEntityId: string;
  billingEntityName?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  creci?: string | null;
  isActive: boolean;
};

type DevelopmentItem = {
  id: string;
  name: string;
  city: string;
  type: string;
  price: string;
  status: string;
  isActive?: boolean;
};

type LotItem = {
  id: string;
  developmentId: string;
  developmentName?: string | null;
  code: string;
  block: string;
  lot: string;
  areaM2: number;
  frontM: number;
  price: string;
  status: "Disponível" | "Reservado" | "Vendido";
};

type ProposalItem = {
  id: string;
  proposalNumber: string;
  clientId?: string | null;
  clientName?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;
  developmentId?: string | null;
  developmentName?: string | null;
  lotId?: string | null;
  lotCode?: string | null;
  brokerId?: string | null;
  brokerName?: string | null;
  totalValue?: number;
  downPaymentValue?: number;
  financedAmount?: number;
  installments?: number;
  interestRate?: number;
  correctionIndex?: string | null;
  firstInstallment?: number;
  paymentMethod?: string | null;
  saleDate?: string | null;
  notes?: string | null;
  status?: string | null;
};

type SaleItem = {
  id: string;
  contractNumber: string;
  clientId: string;
  clientName: string;
  developmentId: string;
  developmentName: string;
  lotId: string;
  lotCode: string;
  brokerId?: string | null;
  brokerName?: string | null;
  totalValue: number;
  downPaymentValue: number;
  financedAmount: number;
  installments: number;
  interestRate: number;
  correctionIndex: string;
  firstInstallment: number;
  paymentMethod: string;
  saleDate: string;
  notes?: string | null;
  status: "rascunho" | "aguardando_assinatura" | "assinado" | "cancelado";
  contractStatus: string;
  signatureStatus: string;
  createdAt?: string;
  updatedAt?: string;
};

type ContractPreview = {
  saleId: string;
  contractNumber: string;
  content: string;
  buyerSignatureDataUrl?: string | null;
  sellerSignatureDataUrl?: string | null;
  buyerIpAddress?: string | null;
};

type SignatureRequestItem = {
  id: string;
  sale_id: string;
  signer_role: string;
  signer_name?: string | null;
  signer_document?: string | null;
  signer_email?: string | null;
  signer_phone?: string | null;
  token?: string | null;
  status: string;
  expires_at?: string | null;
  used_at?: string | null;
  created_at?: string | null;
};

type SignatureItem = {
  id: string;
  sale_id: string;
  signature_request_id?: string | null;
  signer_role: string;
  signer_name: string;
  signer_document?: string | null;
  signer_email?: string | null;
  signer_phone?: string | null;
  signature_data_url: string;
  ip_address?: string | null;
  user_agent?: string | null;
  signed_at?: string | null;
  created_at?: string | null;
};

type SignaturesResponse = {
  requests: SignatureRequestItem[];
  signatures: SignatureItem[];
  sellerDefaultSignatureDataUrl?: string | null;
  sellerDefaultSignatureConfigured?: boolean;
  sellerName?: string | null;
  sellerDocument?: string | null;
  buyerLink?: string | null;
  whatsappMessage?: string | null;
  whatsappUrl?: string | null;
};

type SignatureLinkResponse = {
  success: boolean;
  message: string;
  expiresAt?: string;
  buyerLink?: string;
  whatsappMessage?: string;
  whatsappUrl?: string;
};

type SaleFormState = {
  proposalId: string;
  clientId: string;
  developmentId: string;
  lotId: string;
  brokerId: string;
  saleDate: string;
  totalValue: string;
  downPaymentValue: string;
  installments: string;
  interestRate: string;
  correctionIndex: string;
  paymentMethod: string;
  notes: string;
};

const today = new Date().toISOString().slice(0, 10);

const emptyForm: SaleFormState = {
  proposalId: "NONE",
  clientId: "NONE",
  developmentId: "NONE",
  lotId: "NONE",
  brokerId: "NONE",
  saleDate: today,
  totalValue: "",
  downPaymentValue: "",
  installments: "120",
  interestRate: "0.85",
  correctionIndex: "IGP-M",
  paymentMethod: "Financiamento direto",
  notes: "",
};

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (!value) return 0;

  const normalized = String(value)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
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
  if (rate <= 0) return financedAmount / months;

  const pmt =
    (financedAmount * rate * Math.pow(1 + rate, months)) /
    (Math.pow(1 + rate, months) - 1);

  return Number.isFinite(pmt) ? pmt : 0;
}

function statusBadgeVariant(status: SaleItem["status"]) {
  switch (status) {
    case "assinado":
      return "default";
    case "aguardando_assinatura":
      return "secondary";
    case "cancelado":
      return "destructive";
    default:
      return "outline";
  }
}

function statusLabel(status: SaleItem["status"]) {
  switch (status) {
    case "rascunho":
      return "Rascunho";
    case "aguardando_assinatura":
      return "Aguardando Assinatura";
    case "assinado":
      return "Assinado";
    case "cancelado":
      return "Cancelado";
    default:
      return status;
  }
}

function splitContractForPreview(content?: string | null) {
  const full = content || "";
  const buyerMarker = "ASSINATURA DO COMPRADOR(A)";
  const sellerMarker = "ASSINATURA DA VENDEDOR(A)";

  const buyerIndex = full.indexOf(buyerMarker);

  if (buyerIndex === -1) {
    return {
      body: full,
      buyerSection: "",
      sellerSection: "",
    };
  }

  const sellerIndex = full.indexOf(sellerMarker, buyerIndex);

  if (sellerIndex === -1) {
    return {
      body: full.slice(0, buyerIndex).trimEnd(),
      buyerSection: full.slice(buyerIndex).trim(),
      sellerSection: "",
    };
  }

  return {
    body: full.slice(0, buyerIndex).trimEnd(),
    buyerSection: full.slice(buyerIndex, sellerIndex).trim(),
    sellerSection: full.slice(sellerIndex).trim(),
  };
}

function normalizeText(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeProposal(raw: any): ProposalItem {
  return {
    id: String(raw?.id ?? ""),
    proposalNumber:
      raw?.proposalNumber ||
      raw?.proposal_number ||
      raw?.number ||
      raw?.code ||
      `PROP-${String(raw?.id ?? "").slice(0, 8)}`,
    clientId: raw?.clientId ?? raw?.client_id ?? null,
    clientName: raw?.clientName ?? raw?.client_name ?? null,
    clientPhone: raw?.clientPhone ?? raw?.client_phone ?? null,
    clientEmail: raw?.clientEmail ?? raw?.client_email ?? null,
    developmentId: raw?.developmentId ?? raw?.development_id ?? null,
    developmentName: raw?.developmentName ?? raw?.development_name ?? null,
    lotId: raw?.lotId ?? raw?.lot_id ?? null,
    lotCode: raw?.lotCode ?? raw?.lot_code ?? null,
    brokerId: raw?.brokerId ?? raw?.broker_id ?? null,
    brokerName: raw?.brokerName ?? raw?.broker_name ?? null,
    totalValue: toNumber(raw?.totalValue ?? raw?.total_value ?? raw?.price),
    downPaymentValue: toNumber(
      raw?.downPaymentValue ?? raw?.down_payment_value ?? raw?.entryValue,
    ),
    financedAmount: toNumber(raw?.financedAmount ?? raw?.financed_amount),
    installments: Number(
      raw?.installments ?? raw?.installments_count ?? raw?.term ?? 120,
    ),
    interestRate: Number(raw?.interestRate ?? raw?.interest_rate ?? 0.85),
    correctionIndex: raw?.correctionIndex ?? raw?.correction_index ?? "IGP-M",
    firstInstallment: toNumber(raw?.firstInstallment ?? raw?.first_installment),
    paymentMethod:
      raw?.paymentMethod ?? raw?.payment_method ?? "Financiamento direto",
    saleDate: raw?.saleDate ?? raw?.sale_date ?? today,
    notes: raw?.notes ?? null,
    status: raw?.status ?? null,
  };
}

async function copyToClipboard(text: string) {
  if (!text) return;

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function resolveProposalEntityIds(params: {
  proposal: ProposalItem;
  clients: ClientItem[];
  developments: DevelopmentItem[];
  brokers: BrokerItem[];
  lots: LotItem[];
}) {
  const { proposal, clients, developments, brokers, lots } = params;

  let clientId = "NONE";
  let developmentId = "NONE";
  let brokerId = "NONE";
  let lotId = "NONE";

  if (
    proposal.clientId &&
    clients.some((item) => item.id === proposal.clientId)
  ) {
    clientId = proposal.clientId;
  } else if (proposal.clientName) {
    const foundClient = clients.find(
      (item) => normalizeText(item.fullName) === normalizeText(proposal.clientName),
    );
    if (foundClient) clientId = foundClient.id;
  }

  if (
    proposal.developmentId &&
    developments.some((item) => item.id === proposal.developmentId)
  ) {
    developmentId = proposal.developmentId;
  } else if (proposal.developmentName) {
    const foundDevelopment = developments.find(
      (item) => normalizeText(item.name) === normalizeText(proposal.developmentName),
    );
    if (foundDevelopment) developmentId = foundDevelopment.id;
  }

  if (
    proposal.brokerId &&
    brokers.some((item) => item.id === proposal.brokerId)
  ) {
    brokerId = proposal.brokerId;
  } else if (proposal.brokerName) {
    const foundBroker = brokers.find((item) => {
      const brokerName = item.name || item.billingEntityName || "";
      return normalizeText(brokerName) === normalizeText(proposal.brokerName);
    });
    if (foundBroker) brokerId = foundBroker.id;
  }

  if (proposal.lotId && lots.some((item) => item.id === proposal.lotId)) {
    lotId = proposal.lotId;
  } else if (proposal.lotCode) {
    const lotsFromDevelopment =
      developmentId !== "NONE"
        ? lots.filter((item) => item.developmentId === developmentId)
        : lots;

    const foundLot =
      lotsFromDevelopment.find(
        (item) => normalizeText(item.code) === normalizeText(proposal.lotCode),
      ) ||
      lotsFromDevelopment.find(
        (item) =>
          normalizeText(`${item.block}-${item.lot}`) ===
          normalizeText(proposal.lotCode),
      );

    if (foundLot) lotId = foundLot.id;
  }

  return {
    clientId,
    developmentId,
    brokerId,
    lotId,
  };
}

export default function Sales() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [openForm, setOpenForm] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleItem | null>(null);
  const [form, setForm] = useState<SaleFormState>(emptyForm);

  const [previewSaleId, setPreviewSaleId] = useState<string | null>(null);
  const [openPreview, setOpenPreview] = useState(false);

  const [signatureSaleId, setSignatureSaleId] = useState<string | null>(null);
  const [openSignatures, setOpenSignatures] = useState(false);
  const [generatedBuyerLink, setGeneratedBuyerLink] = useState("");
  const [generatedWhatsappUrl, setGeneratedWhatsappUrl] = useState("");
  const [refreshingRemoteState, setRefreshingRemoteState] = useState(false);

  const { data: currentUser, isLoading: userLoading } = useQuery<SafeUser | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery<ClientItem[]>({
    queryKey: ["/api/admin/clients"],
    retry: false,
    enabled: Boolean(currentUser),
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/clients");
      return await response.json();
    },
  });

  const { data: brokers = [], isLoading: brokersLoading } = useQuery<BrokerItem[]>({
    queryKey: ["/api/admin/brokers"],
    retry: false,
    enabled: Boolean(currentUser),
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/brokers");
      return await response.json();
    },
  });

  const { data: developments = [], isLoading: developmentsLoading } = useQuery<
    DevelopmentItem[]
  >({
    queryKey: ["/api/admin/developments"],
    retry: false,
    enabled: Boolean(currentUser),
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/developments");
      return await response.json();
    },
  });

  const { data: lots = [], isLoading: lotsLoading } = useQuery<LotItem[]>({
    queryKey: ["/api/admin/lots"],
    retry: false,
    enabled: Boolean(currentUser),
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/lots");
      return await response.json();
    },
  });

  const { data: proposals = [] } = useQuery<ProposalItem[]>({
    queryKey: ["/api/proposals"],
    retry: false,
    enabled: Boolean(currentUser),
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/proposals");
        const data = await response.json();
        if (!Array.isArray(data)) return [];
        return data.map(normalizeProposal).filter((item) => item.id);
      } catch {
        return [];
      }
    },
  });

  const {
    data: sales = [],
    isLoading: salesLoading,
    refetch: refetchSales,
  } = useQuery<SaleItem[]>({
    queryKey: ["/api/sales"],
    retry: false,
    enabled: Boolean(currentUser),
    refetchOnWindowFocus: true,
    refetchInterval: openPreview || openSignatures ? 4000 : false,
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/sales");
      return await response.json();
    },
  });

  const {
    data: contractPreview,
    refetch: refetchContractPreview,
  } = useQuery<ContractPreview>({
    queryKey: ["/api/sales/contract-preview", previewSaleId],
    enabled: Boolean(previewSaleId && openPreview),
    refetchOnWindowFocus: true,
    refetchInterval: openPreview ? 4000 : false,
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/sales/${previewSaleId}/contract-preview`,
      );
      return await response.json();
    },
  });

  const {
    data: signaturesData,
    isLoading: signaturesLoading,
    refetch: refetchSignatures,
  } = useQuery<SignaturesResponse>({
    queryKey: ["/api/sales/signatures", signatureSaleId],
    enabled: Boolean(signatureSaleId && openSignatures),
    refetchOnWindowFocus: true,
    refetchInterval: openSignatures ? 4000 : false,
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/sales/${signatureSaleId}/signatures`,
      );
      return await response.json();
    },
  });

  useEffect(() => {
    if (signaturesData?.buyerLink) {
      setGeneratedBuyerLink(signaturesData.buyerLink);
    }
    if (signaturesData?.whatsappUrl) {
      setGeneratedWhatsappUrl(signaturesData.whatsappUrl);
    }
  }, [signaturesData?.buyerLink, signaturesData?.whatsappUrl]);

  async function refreshSignedState(showToast = false) {
    try {
      setRefreshingRemoteState(true);

      await queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      await refetchSales();

      if (openSignatures && signatureSaleId) {
        await queryClient.invalidateQueries({
          queryKey: ["/api/sales/signatures", signatureSaleId],
        });
        await refetchSignatures();
      }

      if (openPreview && previewSaleId) {
        await queryClient.invalidateQueries({
          queryKey: ["/api/sales/contract-preview", previewSaleId],
        });
        await refetchContractPreview();
      }

      if (showToast) {
        toast({
          title: "Dados atualizados",
          description: "O status da assinatura e do contrato foi recarregado.",
        });
      }
    } finally {
      setRefreshingRemoteState(false);
    }
  }

  useEffect(() => {
    function handleFocus() {
      if (!openPreview && !openSignatures) return;
      void refreshSignedState(false);
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      if (!openPreview && !openSignatures) return;
      void refreshSignedState(false);
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    openPreview,
    openSignatures,
    previewSaleId,
    signatureSaleId,
  ]);

  useEffect(() => {
    if (!signaturesData?.signatures?.[0]?.signature_data_url) return;
    void queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
    if (openPreview && previewSaleId) {
      void queryClient.invalidateQueries({
        queryKey: ["/api/sales/contract-preview", previewSaleId],
      });
    }
  }, [
    signaturesData?.signatures?.[0]?.signature_data_url,
    openPreview,
    previewSaleId,
    queryClient,
  ]);

  const loading =
    userLoading ||
    clientsLoading ||
    brokersLoading ||
    developmentsLoading ||
    lotsLoading ||
    salesLoading;

  const activeClients = useMemo(
    () => clients.filter((item) => item.status !== "inactive"),
    [clients],
  );

  const activeBrokers = useMemo(
    () => brokers.filter((item) => item.isActive),
    [brokers],
  );

  const activeDevelopments = useMemo(
    () => developments.filter((item) => item.isActive !== false),
    [developments],
  );

  const availableProposalOptions = useMemo(
    () => proposals.filter((item) => item.status !== "convertida"),
    [proposals],
  );

  const availableLotsForForm = useMemo(() => {
    if (form.developmentId === "NONE") return [];
    return lots.filter(
      (item) =>
        item.developmentId === form.developmentId &&
        (item.status !== "Vendido" ||
          item.id === editingSale?.lotId ||
          item.id === form.lotId),
    );
  }, [lots, form.developmentId, form.lotId, editingSale]);

  const selectedLot = useMemo(
    () => availableLotsForForm.find((item) => item.id === form.lotId),
    [availableLotsForForm, form.lotId],
  );

  const selectedProposal = useMemo(
    () => proposals.find((item) => item.id === form.proposalId) || null,
    [proposals, form.proposalId],
  );

  useEffect(() => {
    if (!selectedLot) return;

    if (!form.totalValue || toNumber(form.totalValue) <= 0) {
      const price = toNumber(selectedLot.price);
      if (price > 0) {
        setForm((prev) => ({
          ...prev,
          totalValue: String(price),
        }));
      }
    }
  }, [selectedLot, form.totalValue]);

  useEffect(() => {
    if (editingSale) return;
    if (form.proposalId === "NONE") return;

    const proposal = proposals.find((item) => item.id === form.proposalId);
    if (!proposal) return;

    const resolved = resolveProposalEntityIds({
      proposal,
      clients: activeClients,
      developments: activeDevelopments,
      brokers: activeBrokers,
      lots,
    });

    setForm((prev) => {
      let changed = false;
      const next = { ...prev };

      if (prev.clientId === "NONE" && resolved.clientId !== "NONE") {
        next.clientId = resolved.clientId;
        changed = true;
      }

      if (prev.developmentId === "NONE" && resolved.developmentId !== "NONE") {
        next.developmentId = resolved.developmentId;
        changed = true;
      }

      if (prev.brokerId === "NONE" && resolved.brokerId !== "NONE") {
        next.brokerId = resolved.brokerId;
        changed = true;
      }

      if (prev.lotId === "NONE" && resolved.lotId !== "NONE") {
        next.lotId = resolved.lotId;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [
    editingSale,
    form.proposalId,
    proposals,
    activeClients,
    activeDevelopments,
    activeBrokers,
    lots,
  ]);

  const financial = useMemo(() => {
    const totalValue = toNumber(form.totalValue);
    const downPaymentValue = toNumber(form.downPaymentValue);
    const installments = Number(form.installments || 0);
    const interestRate = Number(form.interestRate || 0);
    const financedAmount = Math.max(totalValue - downPaymentValue, 0);
    const firstInstallment = calcPriceInstallment(
      financedAmount,
      interestRate,
      installments,
    );

    return {
      totalValue,
      downPaymentValue,
      financedAmount,
      installments,
      interestRate,
      firstInstallment,
    };
  }, [form]);

  const contractParts = useMemo(
    () => splitContractForPreview(contractPreview?.content),
    [contractPreview?.content],
  );

  const markProposalConvertedMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const response = await apiRequest(
        "PATCH",
        `/api/proposals/${proposalId}/status`,
        { status: "convertida" },
      );
      return await response.json();
    },
  });

  const createSaleMutation = useMutation({
    mutationFn: async ({
      payload,
      proposalId,
    }: {
      payload: any;
      proposalId?: string | null;
    }) => {
      const response = await apiRequest("POST", "/api/sales", payload);
      const data = await response.json();
      return { data, proposalId };
    },
    onSuccess: async ({ proposalId }) => {
      if (proposalId) {
        try {
          await markProposalConvertedMutation.mutateAsync(proposalId);
        } catch {}
      }

      toast({
        title: "Venda salva",
        description: "A venda e o contrato base foram criados com sucesso.",
      });
      setOpenForm(false);
      setEditingSale(null);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/lots"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
    },
    onError: async (error: any) => {
      let message = error?.message || "Não foi possível salvar a venda.";
      try {
        if (error?.response?.json) {
          const data = await error.response.json();
          message = data?.message || message;
        }
      } catch {}
      toast({
        title: "Erro ao salvar venda",
        description: message,
        variant: "destructive",
      });
    },
  });

  const updateSaleMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: any;
    }) => {
      const response = await apiRequest("PUT", `/api/sales/${id}`, payload);
      return await response.json();
    },
    onSuccess: async () => {
      toast({
        title: "Venda atualizada",
        description: "A venda foi atualizada com sucesso.",
      });
      setOpenForm(false);
      setEditingSale(null);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/lots"] });
    },
    onError: async (error: any) => {
      let message = error?.message || "Não foi possível atualizar a venda.";
      try {
        if (error?.response?.json) {
          const data = await error.response.json();
          message = data?.message || message;
        }
      } catch {}
      toast({
        title: "Erro ao atualizar venda",
        description: message,
        variant: "destructive",
      });
    },
  });

  const saleStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: SaleItem["status"];
    }) => {
      const response = await apiRequest("PATCH", `/api/sales/${id}/status`, {
        status,
      });
      return await response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/lots"] });
      toast({
        title: "Status atualizado",
        description: "O status da venda foi atualizado.",
      });
    },
    onError: async (error: any) => {
      let message = error?.message || "Não foi possível atualizar o status.";
      try {
        if (error?.response?.json) {
          const data = await error.response.json();
          message = data?.message || message;
        }
      } catch {}
      toast({
        title: "Erro ao atualizar status",
        description: message,
        variant: "destructive",
      });
    },
  });

  const deleteSaleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/sales/${id}`);
      return await response.json();
    },
    onSuccess: async () => {
      toast({
        title: "Venda excluída",
        description: "A venda cancelada foi removida do histórico.",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/lots"] });
    },
    onError: async (error: any) => {
      let message = error?.message || "Não foi possível excluir a venda.";
      try {
        if (error?.response?.json) {
          const data = await error.response.json();
          message = data?.message || message;
        }
      } catch {}
      toast({
        title: "Erro ao excluir venda",
        description: message,
        variant: "destructive",
      });
    },
  });

  const createSignatureLinkMutation = useMutation({
    mutationFn: async ({
      saleId,
      payload,
    }: {
      saleId: string;
      payload: {
        buyerName?: string | null;
        buyerDocument?: string | null;
        buyerEmail?: string | null;
        buyerPhone?: string | null;
        expiresInHours?: number;
      };
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/sales/${saleId}/signature-links`,
        payload,
      );
      return (await response.json()) as SignatureLinkResponse;
    },
    onSuccess: async (data, variables) => {
      setGeneratedBuyerLink(data.buyerLink || "");
      setGeneratedWhatsappUrl(data.whatsappUrl || "");
      await queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      await queryClient.invalidateQueries({
        queryKey: ["/api/sales/signatures", variables.saleId],
      });
      toast({
        title: "Link gerado",
        description: "O link de assinatura do comprador foi criado com sucesso.",
      });
    },
    onError: async (error: any) => {
      let message = error?.message || "Não foi possível gerar o link.";
      try {
        if (error?.response?.json) {
          const data = await error.response.json();
          message = data?.message || message;
        }
      } catch {}
      toast({
        title: "Erro ao gerar link",
        description: message,
        variant: "destructive",
      });
    },
  });

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sales.filter((sale) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : sale.status === statusFilter;

      const text = [
        sale.contractNumber,
        sale.clientName,
        sale.developmentName,
        sale.lotCode,
        sale.brokerName,
        sale.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query ? true : text.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [sales, search, statusFilter]);

  const stats = useMemo(() => {
    const totalValue = sales.reduce((acc, item) => acc + Number(item.totalValue || 0), 0);
    const waiting = sales.filter(
      (item) => item.status === "aguardando_assinatura",
    ).length;

    const availableLots = lots.filter((item) => item.status === "Disponível").length;
    const soldLots = lots.filter((item) => item.status === "Vendido").length;

    return {
      totalSales: sales.length,
      waiting,
      totalValue,
      activeDevelopments: activeDevelopments.length,
      availableLots,
      soldLots,
      clientsCount: activeClients.length,
    };
  }, [sales, activeDevelopments, lots, activeClients]);

  const activeSaleForSignature = useMemo(
    () => sales.find((sale) => sale.id === signatureSaleId) || null,
    [sales, signatureSaleId],
  );

  const activeClientForSignature = useMemo(
    () =>
      clients.find((item) => item.id === activeSaleForSignature?.clientId) || null,
    [clients, activeSaleForSignature],
  );

  const buyerRequest = signaturesData?.requests?.[0] ?? null;
  const buyerSignature = signaturesData?.signatures?.[0] ?? null;

  const resolvedBuyerLink = generatedBuyerLink || signaturesData?.buyerLink || "";
  const resolvedWhatsappUrl =
    generatedWhatsappUrl || signaturesData?.whatsappUrl || "";

  function openCreateModal() {
    setEditingSale(null);
    setForm(emptyForm);
    setOpenForm(true);
  }

  function openEditModal(sale: SaleItem) {
    setEditingSale(sale);
    setForm({
      proposalId: "NONE",
      clientId: sale.clientId,
      developmentId: sale.developmentId,
      lotId: sale.lotId,
      brokerId: sale.brokerId || "NONE",
      saleDate: sale.saleDate?.slice(0, 10) || today,
      totalValue: String(sale.totalValue || 0),
      downPaymentValue: String(sale.downPaymentValue || 0),
      installments: String(sale.installments || 120),
      interestRate: String(sale.interestRate || 0.85),
      correctionIndex: sale.correctionIndex || "IGP-M",
      paymentMethod: sale.paymentMethod || "Financiamento direto",
      notes: sale.notes || "",
    });
    setOpenForm(true);
  }

  function applyProposal(proposalId: string) {
    if (proposalId === "NONE") {
      setForm((prev) => ({
        ...prev,
        proposalId: "NONE",
      }));
      return;
    }

    const proposal = proposals.find((item) => item.id === proposalId);
    if (!proposal) return;

    const resolvedIds = resolveProposalEntityIds({
      proposal,
      clients: activeClients,
      developments: activeDevelopments,
      brokers: activeBrokers,
      lots,
    });

    setForm((prev) => ({
      ...prev,
      proposalId,
      clientId: resolvedIds.clientId,
      developmentId: resolvedIds.developmentId,
      lotId: resolvedIds.lotId,
      brokerId: resolvedIds.brokerId,
      saleDate: proposal.saleDate?.slice(0, 10) || prev.saleDate || today,
      totalValue:
        proposal.totalValue && proposal.totalValue > 0
          ? String(proposal.totalValue)
          : prev.totalValue,
      downPaymentValue:
        proposal.downPaymentValue && proposal.downPaymentValue > 0
          ? String(proposal.downPaymentValue)
          : prev.downPaymentValue,
      installments:
        proposal.installments && proposal.installments > 0
          ? String(proposal.installments)
          : prev.installments,
      interestRate:
        typeof proposal.interestRate === "number"
          ? String(proposal.interestRate)
          : prev.interestRate,
      correctionIndex: proposal.correctionIndex || prev.correctionIndex,
      paymentMethod: proposal.paymentMethod || prev.paymentMethod,
      notes: proposal.notes || prev.notes,
    }));

    toast({
      title: "Proposta aplicada",
      description:
        resolvedIds.clientId !== "NONE" ||
        resolvedIds.developmentId !== "NONE" ||
        resolvedIds.lotId !== "NONE"
          ? "Os dados da proposta foram carregados na venda."
          : "A proposta foi lida, mas os cadastros não foram encontrados pelos IDs. Revise os vínculos da proposta.",
    });
  }

  function buildPayload() {
    if (form.clientId === "NONE") {
      throw new Error("Selecione o cliente");
    }
    if (form.developmentId === "NONE") {
      throw new Error("Selecione o empreendimento");
    }
    if (form.lotId === "NONE") {
      throw new Error("Selecione o lote");
    }

    const client = activeClients.find((item) => item.id === form.clientId);
    const development = activeDevelopments.find(
      (item) => item.id === form.developmentId,
    );
    const lot = lots.find((item) => item.id === form.lotId);
    const broker = activeBrokers.find((item) => item.id === form.brokerId);

    if (!client) throw new Error("Cliente inválido");
    if (!development) throw new Error("Empreendimento inválido");
    if (!lot) throw new Error("Lote inválido");

    return {
      clientId: client.id,
      clientName: client.fullName,
      clientPhone: client.phone ?? null,
      clientEmail: client.email ?? null,
      developmentId: development.id,
      developmentName: development.name,
      lotId: lot.id,
      lotCode: lot.code,
      brokerId: broker?.id ?? null,
      brokerName: broker?.name ?? broker?.billingEntityName ?? null,
      totalValue: financial.totalValue,
      downPaymentValue: financial.downPaymentValue,
      financedAmount: financial.financedAmount,
      installments: financial.installments,
      interestRate: financial.interestRate,
      correctionIndex: form.correctionIndex,
      firstInstallment: financial.firstInstallment,
      paymentMethod: form.paymentMethod,
      saleDate: form.saleDate,
      notes: form.notes || null,
    };
  }

  function handleSaveSale() {
    try {
      const payload = buildPayload();

      if (editingSale) {
        updateSaleMutation.mutate({
          id: editingSale.id,
          payload,
        });
        return;
      }

      createSaleMutation.mutate({
        payload,
        proposalId: form.proposalId !== "NONE" ? form.proposalId : null,
      });
    } catch (error: any) {
      toast({
        title: "Dados incompletos",
        description: error?.message || "Verifique os dados da venda.",
        variant: "destructive",
      });
    }
  }

  function handleOpenPreview(saleId: string) {
    setPreviewSaleId(saleId);
    setOpenPreview(true);
    void queryClient.invalidateQueries({
      queryKey: ["/api/sales/contract-preview", saleId],
    });
    void queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
  }

  function handleOpenSignatures(saleId: string) {
    setSignatureSaleId(saleId);
    setGeneratedBuyerLink("");
    setGeneratedWhatsappUrl("");
    setOpenSignatures(true);
    void queryClient.invalidateQueries({
      queryKey: ["/api/sales/signatures", saleId],
    });
    void queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
  }

  function handleCopyContract() {
    if (!contractPreview?.content) return;
    copyToClipboard(contractPreview.content);
    toast({
      title: "Contrato copiado",
      description: "O texto do contrato foi copiado.",
    });
  }

  function handleDeleteSale(sale: SaleItem) {
    if (sale.status !== "cancelado") {
      toast({
        title: "Ação não permitida",
        description: "Somente vendas canceladas podem ser excluídas.",
        variant: "destructive",
      });
      return;
    }

    const ok = window.confirm(
      `Deseja excluir definitivamente a venda ${sale.contractNumber}?`,
    );

    if (!ok) return;
    deleteSaleMutation.mutate(sale.id);
  }

  async function generateBuyerLinkForSale(sale: SaleItem) {
    const client = clients.find((item) => item.id === sale.clientId);

    return await createSignatureLinkMutation.mutateAsync({
      saleId: sale.id,
      payload: {
        buyerName: sale.clientName,
        buyerEmail: client?.email ?? null,
        buyerPhone: client?.phone ?? null,
        expiresInHours: 72,
      },
    });
  }

  async function handleGenerateBuyerLink(sale: SaleItem) {
    try {
      await generateBuyerLinkForSale(sale);
    } catch {}
  }

  async function handleGenerateLinkAndOpenSignatures(sale: SaleItem) {
    setSignatureSaleId(sale.id);
    setOpenSignatures(true);
    setGeneratedBuyerLink("");
    setGeneratedWhatsappUrl("");
    try {
      await generateBuyerLinkForSale(sale);
      await refreshSignedState(false);
    } catch {}
  }

  function openWhatsappWithLink(
    link: string,
    sale?: SaleItem | null,
    client?: ClientItem | null,
  ) {
    if (!link) {
      toast({
        title: "Nenhum link gerado",
        description: "Gere o link antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    const whatsapp = toWhatsappNumber(client?.phone);
    if (!whatsapp) {
      toast({
        title: "Cliente sem telefone",
        description: "O cliente não possui telefone válido para WhatsApp.",
        variant: "destructive",
      });
      return;
    }

    const contractNumber = sale?.contractNumber || "";
    const clientName = sale?.clientName || "cliente";
    const developmentName = sale?.developmentName || "";
    const lotCode = sale?.lotCode || "";

    const message =
      `Olá, ${clientName}.\n\n` +
      `Segue o link para assinatura do contrato ${contractNumber}.\n` +
      `${developmentName} - lote ${lotCode}\n\n` +
      `${link}`;

    const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  async function handleGenerateAndSendBuyerLink(sale: SaleItem) {
    try {
      const data = await generateBuyerLinkForSale(sale);

      if (data?.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
        return;
      }

      if (data?.buyerLink) {
        const client = clients.find((item) => item.id === sale.clientId) || null;
        openWhatsappWithLink(data.buyerLink, sale, client);
        return;
      }

      toast({
        title: "Link não retornado",
        description: "O backend não retornou o link para envio.",
        variant: "destructive",
      });
    } catch {}
  }

  async function handleCopyBuyerLink() {
    if (!resolvedBuyerLink) {
      toast({
        title: "Nenhum link gerado",
        description: "Gere o link antes de copiar.",
        variant: "destructive",
      });
      return;
    }

    await copyToClipboard(resolvedBuyerLink);
    toast({
      title: "Link copiado",
      description: "O link de assinatura foi copiado.",
    });
  }

  function handleSendBuyerLinkWhatsapp() {
    if (resolvedWhatsappUrl) {
      window.open(resolvedWhatsappUrl, "_blank");
      return;
    }

    openWhatsappWithLink(
      resolvedBuyerLink,
      activeSaleForSignature,
      activeClientForSignature,
    );
  }

  const canCreateSale = true;
  const isBroker = currentUser?.role === "broker";

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-10 flex items-center justify-center text-slate-500">
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Carregando módulo de contratos e vendas...
            </span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Contratos & Vendas
          </h1>
          <p className="text-slate-500">
            {isBroker
              ? "O corretor pode acompanhar vendas e contratos. Aprovação e assinatura seguem fluxo controlado."
              : "Módulo real de vendas com contrato padrão alimentado pelo sistema."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="gap-2 bg-white text-slate-700" disabled>
            <Download className="h-4 w-4" />
            Exportar Relatório
          </Button>

          {canCreateSale ? (
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              onClick={openCreateModal}
            >
              <PlusCircle className="h-4 w-4" />
              Nova Venda
            </Button>
          ) : (
            <Button variant="outline" className="gap-2 bg-white text-slate-500" disabled>
              <Lock className="h-4 w-4" />
              Sem permissão
            </Button>
          )}
        </div>
      </div>

      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-6">
          <div className="text-lg font-black text-slate-900">
            Base real de vendas ativada
          </div>
          <div className="text-slate-700 mt-2">
            Nesta etapa, a venda já fica persistida no banco e o contrato padrão
            passa a ser gerado com os dados reais do cliente, empreendimento, lote,
            corretor e condição comercial.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Vendas em Carteira
              </p>
              <p className="text-2xl font-black text-slate-800">
                {stats.totalSales}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Aguardando Assinatura
              </p>
              <p className="text-2xl font-black text-amber-600">
                {stats.waiting}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <FileSignature className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                VGV Total
              </p>
              <p className="text-2xl font-black text-blue-700">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <BadgeDollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Empreendimentos
              </p>
              <p className="text-2xl font-black text-slate-800">
                {stats.activeDevelopments}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-slate-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Lotes Disponíveis
              </p>
              <p className="text-2xl font-black text-slate-800">
                {stats.availableLots}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-slate-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Lotes Vendidos
              </p>
              <p className="text-2xl font-black text-slate-800">
                {stats.soldLots}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-slate-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Clientes
              </p>
              <p className="text-2xl font-black text-slate-800">
                {stats.clientsCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-slate-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200 bg-white">
        <CardHeader className="p-4 border-b border-slate-100 pb-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por contrato, cliente ou lote..."
                className="pl-9 bg-slate-50 border-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[240px] bg-white">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="aguardando_assinatura">Aguardando Assinatura</SelectItem>
                <SelectItem value="assinado">Assinado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2 bg-white text-slate-700" disabled>
              <Filter className="h-4 w-4" />
              Filtros Avançados
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredSales.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <FileSignature className="h-7 w-7 text-slate-500" />
              </div>

              <h3 className="text-lg font-black text-slate-900">
                Nenhuma venda ou contrato cadastrado
              </h3>

              <p className="text-slate-500 mt-2 max-w-2xl mx-auto">
                Comece criando a primeira venda. O sistema já vai gerar o contrato
                padrão automaticamente com os dados do cadastro.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="border-slate-200">
                    <TableHead className="font-bold text-slate-600">Contrato</TableHead>
                    <TableHead className="font-bold text-slate-600">Cliente</TableHead>
                    <TableHead className="font-bold text-slate-600">Empreendimento</TableHead>
                    <TableHead className="font-bold text-slate-600">Valor / Pgto</TableHead>
                    <TableHead className="hidden lg:table-cell font-bold text-slate-600">
                      Corretor
                    </TableHead>
                    <TableHead className="hidden md:table-cell font-bold text-slate-600">
                      Data
                    </TableHead>
                    <TableHead className="font-bold text-slate-600">Status</TableHead>
                    <TableHead className="font-bold text-slate-600 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="font-medium">{sale.contractNumber}</div>
                        <div className="text-xs text-slate-500">{sale.lotCode}</div>
                      </TableCell>

                      <TableCell>{sale.clientName}</TableCell>
                      <TableCell>{sale.developmentName}</TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(sale.totalValue)}</div>
                        <div className="text-xs text-slate-500">
                          {sale.installments}x • {sale.paymentMethod}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {sale.brokerName || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {sale.saleDate?.slice(0, 10)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(sale.status)}>
                          {statusLabel(sale.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => openEditModal(sale)}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleOpenPreview(sale.id)}
                          >
                            <Eye className="h-4 w-4" />
                            Contrato
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleOpenSignatures(sale.id)}
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Assinaturas
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleGenerateLinkAndOpenSignatures(sale)}
                            disabled={createSignatureLinkMutation.isPending}
                          >
                            <LinkIcon className="h-4 w-4" />
                            {createSignatureLinkMutation.isPending ? "Gerando..." : "Link"}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleGenerateAndSendBuyerLink(sale)}
                            disabled={createSignatureLinkMutation.isPending}
                          >
                            <MessageCircle className="h-4 w-4" />
                            Enviar Link
                          </Button>

                          {sale.status !== "cancelado" ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-2"
                              onClick={() =>
                                saleStatusMutation.mutate({
                                  id: sale.id,
                                  status: "cancelado",
                                })
                              }
                            >
                              <XCircle className="h-4 w-4" />
                              Cancelar
                            </Button>
                          ) : (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-2"
                              onClick={() => handleDeleteSale(sale)}
                              disabled={deleteSaleMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </Button>
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
        <DialogContent className="w-[calc(100vw-1rem)] max-w-[920px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSale ? "Editar venda" : "Nova venda"}
            </DialogTitle>
            <DialogDescription>
              Cadastre a venda e gere o contrato padrão com os dados do sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-2">
            {!editingSale ? (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Converter proposta em venda
                    </div>
                    <div className="text-sm text-slate-600">
                      Escolha uma proposta para preencher automaticamente os campos da venda.
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <div className="space-y-2">
                      <Label>Proposta</Label>

                      <select
                        value={form.proposalId}
                        onChange={(e) => applyProposal(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500"
                      >
                        <option value="NONE">Selecione uma proposta</option>
                        {availableProposalOptions.map((proposal) => (
                          <option key={proposal.id} value={proposal.id}>
                            {proposal.proposalNumber} • {proposal.clientName || "Cliente"} •{" "}
                            {proposal.lotCode || "Lote"}
                          </option>
                        ))}
                      </select>

                      <div className="text-xs text-slate-500">
                        Propostas carregadas: {availableProposalOptions.length}
                      </div>
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setForm((prev) => ({
                            ...emptyForm,
                            proposalId: "NONE",
                            saleDate: prev.saleDate || today,
                          }));
                        }}
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>

                  {selectedProposal ? (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                      <div className="rounded-md border bg-white p-3">
                        <div className="text-slate-500">Proposta</div>
                        <div className="font-semibold">{selectedProposal.proposalNumber}</div>
                      </div>
                      <div className="rounded-md border bg-white p-3">
                        <div className="text-slate-500">Cliente</div>
                        <div className="font-semibold">{selectedProposal.clientName || "-"}</div>
                      </div>
                      <div className="rounded-md border bg-white p-3">
                        <div className="text-slate-500">Empreendimento</div>
                        <div className="font-semibold">
                          {selectedProposal.developmentName || "-"}
                        </div>
                      </div>
                      <div className="rounded-md border bg-white p-3">
                        <div className="text-slate-500">Lote</div>
                        <div className="font-semibold">{selectedProposal.lotCode || "-"}</div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  value={form.clientId}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, clientId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Selecione...</SelectItem>
                    {activeClients.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Corretor</Label>
                <Select
                  value={form.brokerId}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, brokerId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o corretor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Sem corretor</SelectItem>
                    {activeBrokers.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name || item.billingEntityName || "Corretor"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Empreendimento *</Label>
                <Select
                  value={form.developmentId}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      developmentId: value,
                      lotId: "NONE",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o empreendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Selecione...</SelectItem>
                    {activeDevelopments.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Lote *</Label>
                <Select
                  value={form.lotId}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, lotId: value }))
                  }
                  disabled={form.developmentId === "NONE"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o lote" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    <SelectItem value="NONE">Selecione...</SelectItem>
                    {availableLotsForForm.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.code} • {item.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data da venda</Label>
                <Input
                  type="date"
                  value={form.saleDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, saleDate: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Forma de pagamento</Label>
                <Input
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, paymentMethod: e.target.value }))
                  }
                  placeholder="Financiamento direto"
                />
              </div>

              <div className="space-y-2">
                <Label>Valor total</Label>
                <Input
                  type="number"
                  value={form.totalValue}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, totalValue: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Entrada</Label>
                <Input
                  type="number"
                  value={form.downPaymentValue}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      downPaymentValue: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Prazo (meses)</Label>
                <Input
                  type="number"
                  value={form.installments}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, installments: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Juros (% a.m.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.interestRate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, interestRate: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Índice de correção</Label>
                <Input
                  value={form.correctionIndex}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      correctionIndex: e.target.value,
                    }))
                  }
                  placeholder="IGP-M"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Observações</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={4}
                  placeholder="Cláusulas comerciais, observações, descontos..."
                />
              </div>
            </div>

            <Card className="border-slate-200 bg-slate-50">
              <CardContent className="p-4 grid gap-2 md:grid-cols-4 text-sm">
                <div>
                  <div className="text-slate-500">Valor total</div>
                  <div className="font-bold text-slate-900">
                    {formatCurrency(financial.totalValue)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Entrada</div>
                  <div className="font-bold text-slate-900">
                    {formatCurrency(financial.downPaymentValue)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Saldo financiado</div>
                  <div className="font-bold text-slate-900">
                    {formatCurrency(financial.financedAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">1ª parcela estimada</div>
                  <div className="font-bold text-emerald-700">
                    {formatCurrency(financial.firstInstallment)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenForm(false);
                  setEditingSale(null);
                  setForm(emptyForm);
                }}
              >
                Cancelar
              </Button>

              <Button
                onClick={handleSaveSale}
                disabled={
                  createSaleMutation.isPending ||
                  updateSaleMutation.isPending ||
                  markProposalConvertedMutation.isPending
                }
              >
                {createSaleMutation.isPending ||
                updateSaleMutation.isPending ||
                markProposalConvertedMutation.isPending
                  ? "Salvando..."
                  : "Salvar venda"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openPreview} onOpenChange={setOpenPreview}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-[1100px] h-[92vh] p-0 overflow-hidden">
          <div className="h-full bg-white">
            <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-white">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <DialogTitle>Prévia do contrato</DialogTitle>
                  <DialogDescription>
                    Contrato padrão alimentado automaticamente com os dados da venda.
                  </DialogDescription>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => refreshSignedState(true)}
                    disabled={refreshingRemoteState}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshingRemoteState ? "animate-spin" : ""}`}
                    />
                    Atualizar
                  </Button>

                  <Button variant="outline" onClick={handleCopyContract}>
                    Copiar texto
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="h-[calc(92vh-88px)] overflow-y-auto bg-slate-100 px-3 py-3 sm:px-4 sm:py-4">
              <div className="mx-auto w-full max-w-5xl rounded-lg border bg-white p-4 sm:p-6 shadow-sm">
                <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">
                  {contractParts.body || "Carregando contrato..."}
                </div>

                {(contractParts.buyerSection || contractParts.sellerSection) && (
                  <div className="mt-10 border-t pt-8 pb-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      {contractParts.buyerSection ? (
                        <div className="space-y-4">
                          <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">
                            {contractParts.buyerSection}
                          </div>

                          <div className="rounded-md border bg-slate-50 p-4">
                            {contractPreview?.buyerSignatureDataUrl ? (
                              <img
                                src={contractPreview.buyerSignatureDataUrl}
                                alt="Assinatura do comprador"
                                className="h-28 w-full object-contain"
                              />
                            ) : (
                              <div className="flex h-28 w-full items-center justify-center rounded border border-dashed bg-white text-center text-xs text-slate-400">
                                Comprador ainda não assinou
                              </div>
                            )}

                            <div className="mt-3 text-xs text-slate-500">
                              IP do comprador:{" "}
                              <span className="font-semibold text-slate-700">
                                {contractPreview?.buyerIpAddress || "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {contractParts.sellerSection ? (
                        <div className="space-y-4">
                          <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">
                            {contractParts.sellerSection}
                          </div>

                          <div className="rounded-md border bg-slate-50 p-4">
                            {contractPreview?.sellerSignatureDataUrl ? (
                              <img
                                src={contractPreview.sellerSignatureDataUrl}
                                alt="Assinatura do vendedor"
                                className="h-28 w-full object-contain"
                              />
                            ) : (
                              <div className="flex h-28 w-full items-center justify-center rounded border border-dashed bg-white text-center text-xs text-slate-400">
                                Assinatura padrão do vendedor não cadastrada
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openSignatures} onOpenChange={setOpenSignatures}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-[1000px] h-[92vh] p-0 overflow-hidden">
          <div className="h-full bg-white">
            <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <DialogTitle>Assinaturas da venda</DialogTitle>
                  <DialogDescription>
                    Gere o link do comprador, copie ou envie pelo WhatsApp e acompanhe a assinatura.
                  </DialogDescription>
                </div>

                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => refreshSignedState(true)}
                  disabled={refreshingRemoteState}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshingRemoteState ? "animate-spin" : ""}`}
                  />
                  Atualizar
                </Button>
              </div>
            </DialogHeader>

            {signaturesLoading ? (
              <div className="flex h-[calc(92vh-88px)] items-center justify-center px-4 text-slate-500">
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Carregando assinaturas...
              </div>
            ) : (
              <>
                <div className="h-[calc(92vh-160px)] overflow-y-auto bg-slate-50 px-4 py-4 sm:px-6">
                  <div className="space-y-5 pb-6">
                    <div className="grid gap-4 xl:grid-cols-3">
                      <Card className="border-slate-200 bg-white">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Contrato</CardTitle>
                          <CardDescription>Número e situação atual.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div>
                            <span className="text-slate-500">Número:</span>{" "}
                            <strong>{activeSaleForSignature?.contractNumber || "-"}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Status:</span>{" "}
                            <Badge
                              variant={statusBadgeVariant(
                                activeSaleForSignature?.status || "rascunho",
                              )}
                            >
                              {statusLabel(activeSaleForSignature?.status || "rascunho")}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-slate-500">Assinatura:</span>{" "}
                            <strong>{activeSaleForSignature?.signatureStatus || "-"}</strong>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200 bg-white">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Comprador</CardTitle>
                          <CardDescription>Link e confirmação da assinatura.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div>
                            <span className="text-slate-500">Cliente:</span>{" "}
                            <strong>{activeSaleForSignature?.clientName || "-"}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Link:</span>{" "}
                            <strong>{buyerRequest ? "Gerado" : "Não gerado"}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Status:</span>{" "}
                            <strong>{buyerRequest?.status || "sem solicitação"}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Expira em:</span>{" "}
                            <strong>{formatDateTime(buyerRequest?.expires_at)}</strong>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200 bg-white">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Vendedor</CardTitle>
                          <CardDescription>Assinatura padrão do proprietário.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div>
                            <span className="text-slate-500">Nome:</span>{" "}
                            <strong>{signaturesData?.sellerName || "-"}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Documento:</span>{" "}
                            <strong>{signaturesData?.sellerDocument || "-"}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Arquivo:</span>{" "}
                            <strong>
                              {signaturesData?.sellerDefaultSignatureConfigured
                                ? "Cadastrado"
                                : "Não cadastrado"}
                            </strong>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-slate-200 bg-white">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Link de assinatura</CardTitle>
                        <CardDescription>
                          Gere o link do comprador e envie em seguida.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label>Link gerado</Label>
                          <Input
                            value={resolvedBuyerLink}
                            readOnly
                            placeholder="Gere o link para aparecer aqui"
                            className="bg-slate-50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>URL pronta do WhatsApp</Label>
                          <Input
                            value={resolvedWhatsappUrl}
                            readOnly
                            placeholder="Ao gerar o link, a URL pronta do WhatsApp aparece aqui"
                            className="bg-slate-50"
                          />
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 text-sm">
                          <div className="rounded-md border bg-slate-50 p-3">
                            <div className="text-slate-500">Telefone</div>
                            <div className="font-medium text-slate-900">
                              {activeClientForSignature?.phone || "-"}
                            </div>
                          </div>

                          <div className="rounded-md border bg-slate-50 p-3">
                            <div className="text-slate-500">E-mail</div>
                            <div className="font-medium text-slate-900 break-all">
                              {activeClientForSignature?.email || "-"}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <Card className="border-slate-200 bg-white">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Assinatura do comprador</CardTitle>
                          <CardDescription>
                            Dados capturados pelo link público.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid gap-2 text-sm">
                            <div>
                              <span className="text-slate-500">Nome:</span>{" "}
                              <strong>{buyerSignature?.signer_name || "-"}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500">Documento:</span>{" "}
                              <strong>{buyerSignature?.signer_document || "-"}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500">Assinou em:</span>{" "}
                              <strong>{formatDateTime(buyerSignature?.signed_at)}</strong>
                            </div>

                            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                              <span className="text-blue-700 text-xs font-semibold uppercase tracking-wide">
                                IP do comprador
                              </span>
                              <div className="mt-1 break-all text-sm font-bold text-slate-900">
                                {buyerSignature?.ip_address || "-"}
                              </div>
                            </div>

                            <div>
                              <span className="text-slate-500">User-Agent:</span>{" "}
                              <span className="break-all text-xs">
                                {buyerSignature?.user_agent || "-"}
                              </span>
                            </div>
                          </div>

                          {buyerSignature?.signature_data_url ? (
                            <img
                              src={buyerSignature.signature_data_url}
                              alt="Assinatura do comprador"
                              className="max-h-44 w-full rounded-md border bg-white object-contain p-2"
                            />
                          ) : (
                            <div className="rounded-md border border-dashed p-6 text-sm text-slate-500">
                              O comprador ainda não assinou.
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200 bg-white">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Assinatura do vendedor</CardTitle>
                          <CardDescription>
                            Arquivo padrão salvo no sistema.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {signaturesData?.sellerDefaultSignatureDataUrl ? (
                            <img
                              src={signaturesData.sellerDefaultSignatureDataUrl}
                              alt="Assinatura do vendedor"
                              className="max-h-44 w-full rounded-md border bg-white object-contain p-2"
                            />
                          ) : (
                            <div className="rounded-md border border-dashed p-6 text-sm text-slate-500">
                              Cadastre a assinatura padrão do vendedor em:
                              <div className="mt-2 font-mono text-xs break-all">
                                server/assets/signatures/sellers/
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                <div className="border-t bg-white px-4 py-3 sm:px-6">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <Button
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() =>
                        activeSaleForSignature &&
                        handleGenerateBuyerLink(activeSaleForSignature)
                      }
                      disabled={
                        !activeSaleForSignature ||
                        createSignatureLinkMutation.isPending
                      }
                    >
                      <LinkIcon className="h-4 w-4" />
                      {createSignatureLinkMutation.isPending
                        ? "Gerando..."
                        : "Gerar link"}
                    </Button>

                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={handleCopyBuyerLink}
                      disabled={!resolvedBuyerLink}
                    >
                      <Copy className="h-4 w-4" />
                      Copiar link
                    </Button>

                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={handleSendBuyerLinkWhatsapp}
                      disabled={!resolvedBuyerLink && !resolvedWhatsappUrl}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Enviar WhatsApp
                    </Button>

                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => refreshSignedState(true)}
                      disabled={refreshingRemoteState}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${refreshingRemoteState ? "animate-spin" : ""}`}
                      />
                      Atualizar
                    </Button>
                  </div>

                  <div className="mt-3 text-[11px] text-slate-500">
                    A assinatura pública foi salva no backend. Esta tela agora atualiza automaticamente e também permite atualização manual.
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}