import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { SafeUser } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Users,
  MapPin,
  Download,
  FileText,
  Eye,
  Printer,
  CalendarDays,
  Building2,
  BriefcaseBusiness,
  LoaderCircle,
  UserRound,
  Phone,
  Building,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type PeriodKey = "Hoje" | "Esta Semana" | "Este Mês" | "Este Ano";

type DevelopmentItem = {
  id: string;
  name: string;
  city: string;
  status: string;
  totalLots: number;
  isActive?: boolean;
};

type LotItem = {
  id: string;
  developmentId: string;
  developmentName: string;
  code: string;
  block: string;
  lot: string;
  areaM2: number;
  frontM: number;
  price: string;
  status: "Disponível" | "Reservado" | "Vendido";
  createdAt?: string;
  updatedAt?: string;
};

type ClientItem = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  objective?: string | null;
  budgetRange?: string | null;
  timeline?: string | null;
  profileNotes?: string | null;
  source: string;
  projectId?: string | null;
  projectName?: string | null;
  status: string;
  brokerId?: string | null;
  brokerName?: string | null;
  assignedBroker?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type BrokerItem = {
  id: string;
  billingEntityId: string;
  billingEntityName?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  creci?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type InterestItem = {
  id: string;
  project_id?: string | null;
  project_name: string;
  source: string;
  full_name: string;
  phone: string;
  email?: string | null;
  city_interest?: string | null;
  objective?: string | null;
  budget_range?: string | null;
  timeline?: string | null;
  family_profile?: string | null;
  notes?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

type RecentInterestItem = {
  id: string;
  fullName: string;
  projectName: string;
  phone: string;
  status: string;
  source: string;
  createdAt: string;
};

function getCurrentDateTime() {
  return new Date().toLocaleString("pt-BR");
}

function formatDateBR(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

function formatDateTimeBR(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR");
}

function getInterestStatusLabel(status: string) {
  if (status === "converted_client") return "Convertido";
  if (status === "new") return "Novo";
  return status || "Sem status";
}

function getInterestStatusBadgeClass(status: string) {
  if (status === "converted_client") return "bg-emerald-100 text-emerald-700";
  if (status === "new") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-700";
}

function getPeriodStart(period: PeriodKey) {
  const now = new Date();

  if (period === "Hoje") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (period === "Esta Semana") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (period === "Este Mês") {
    const start = new Date(now);
    start.setDate(now.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  const start = new Date(now.getFullYear(), 0, 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function buildChartData(interests: InterestItem[], period: PeriodKey) {
  const now = new Date();
  const filtered = interests.filter((item) => {
    const createdAt = item.created_at ? new Date(item.created_at) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
    return createdAt >= getPeriodStart(period);
  });

  if (period === "Hoje") {
    const items = Array.from({ length: 8 }).map((_, index) => {
      const date = new Date(now);
      date.setHours(now.getHours() - (7 - index), 0, 0, 0);
      const hour = date.getHours().toString().padStart(2, "0");

      return {
        name: `${hour}h`,
        total: 0,
      };
    });

    filtered.forEach((item) => {
      const createdAt = new Date(item.created_at!);
      const hourLabel = `${createdAt.getHours().toString().padStart(2, "0")}h`;
      const target = items.find((entry) => entry.name === hourLabel);
      if (target) target.total += 1;
    });

    return {
      title: "Pré-atendimentos de Hoje",
      chartType: "bar" as const,
      data: items,
    };
  }

  if (period === "Esta Semana") {
    const items = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      date.setHours(0, 0, 0, 0);

      return {
        key: date.toDateString(),
        name: date.toLocaleDateString("pt-BR", { weekday: "short" }),
        total: 0,
      };
    });

    filtered.forEach((item) => {
      const createdAt = new Date(item.created_at!);
      createdAt.setHours(0, 0, 0, 0);
      const target = items.find((entry) => entry.key === createdAt.toDateString());
      if (target) target.total += 1;
    });

    return {
      title: "Pré-atendimentos da Semana",
      chartType: "bar" as const,
      data: items.map(({ name, total }) => ({ name, total })),
    };
  }

  if (period === "Este Mês") {
    const items = Array.from({ length: 30 }).map((_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (29 - index));
      date.setHours(0, 0, 0, 0);

      return {
        key: date.toDateString(),
        name: date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        total: 0,
      };
    });

    filtered.forEach((item) => {
      const createdAt = new Date(item.created_at!);
      createdAt.setHours(0, 0, 0, 0);
      const target = items.find((entry) => entry.key === createdAt.toDateString());
      if (target) target.total += 1;
    });

    return {
      title: "Pré-atendimentos do Mês",
      chartType: "area" as const,
      data: items.map(({ name, total }) => ({ name, total })),
    };
  }

  const monthNames = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const items = monthNames.map((name, index) => ({
    month: index,
    name,
    total: 0,
  }));

  filtered.forEach((item) => {
    const createdAt = new Date(item.created_at!);
    const target = items.find((entry) => entry.month === createdAt.getMonth());
    if (target) target.total += 1;
  });

  return {
    title: "Pré-atendimentos do Ano",
    chartType: "area" as const,
    data: items.map(({ name, total }) => ({ name, total })),
  };
}

function buildPrintableReport(params: {
  period: PeriodKey;
  issuedAt: string;
  developmentsCount: number;
  lotsAvailable: number;
  lotsReserved: number;
  lotsSold: number;
  totalLots: number;
  clientsCount: number;
  activeBrokers: number;
  interestsCount: number;
  convertedInterests: number;
  chartTitle: string;
  summary: string;
  notes: string[];
  recentInterests: RecentInterestItem[];
}) {
  const rows = params.recentInterests
    .map(
      (item) => `
        <tr>
          <td>${item.fullName}</td>
          <td>${item.projectName}</td>
          <td>${item.phone}</td>
          <td>${getInterestStatusLabel(item.status)}</td>
          <td>${item.source}</td>
          <td>${formatDateTimeBR(item.createdAt)}</td>
        </tr>
      `,
    )
    .join("");

  const notes = params.notes.map((note) => `<li>${note}</li>`).join("");

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Relatório Operacional - ${params.period}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            color: #0f172a;
            background: #f8fafc;
          }
          .page {
            max-width: 1100px;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
          }
          .header {
            background: linear-gradient(135deg, #0f172a, #111827);
            color: white;
            padding: 32px;
          }
          .brand {
            font-size: 30px;
            font-weight: 800;
            margin: 0 0 6px 0;
          }
          .sub {
            color: #cbd5e1;
            margin: 0;
            font-size: 14px;
          }
          .meta {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 18px;
          }
          .meta-item {
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.12);
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 13px;
          }
          .content {
            padding: 28px 32px 40px;
          }
          .section-title {
            font-size: 20px;
            font-weight: 800;
            margin: 28px 0 14px;
          }
          .summary {
            border-left: 4px solid #10b981;
            background: #f0fdf4;
            padding: 16px 18px;
            border-radius: 10px;
            color: #14532d;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin: 20px 0;
          }
          .card {
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 18px;
            background: #ffffff;
          }
          .card h3 {
            margin: 0 0 8px 0;
            font-size: 13px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: .04em;
          }
          .card p {
            margin: 0;
            font-size: 26px;
            font-weight: 800;
          }
          .hint {
            margin-top: 8px;
            color: #475569;
            font-size: 12px;
          }
          ul {
            margin: 0;
            padding-left: 20px;
          }
          li {
            margin: 8px 0;
            line-height: 1.5;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            background: white;
          }
          th, td {
            border: 1px solid #e2e8f0;
            padding: 12px 10px;
            text-align: left;
            font-size: 13px;
          }
          th {
            background: #ecfdf5;
            color: #065f46;
            font-weight: 700;
          }
          .footer-box {
            margin-top: 28px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
          }
          .signature {
            border-top: 1px solid #94a3b8;
            padding-top: 8px;
            margin-top: 42px;
            color: #475569;
            font-size: 13px;
          }
          .print-actions {
            padding: 0 32px 32px;
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }
          .btn {
            background: #10b981;
            color: white;
            border: none;
            padding: 12px 18px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: 700;
          }
          .btn-dark {
            background: #0f172a;
          }
          @media print {
            .print-actions {
              display: none;
            }
            body {
              background: white;
            }
            .page {
              max-width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <p class="brand">SmartloteIA</p>
            <p class="sub">Relatório Operacional</p>

            <div class="meta">
              <div class="meta-item"><strong>Período:</strong> ${params.period}</div>
              <div class="meta-item"><strong>Emitido em:</strong> ${params.issuedAt}</div>
              <div class="meta-item"><strong>Origem:</strong> Dados do PostgreSQL</div>
            </div>
          </div>

          <div class="content">
            <div class="summary">
              <strong>Resumo:</strong><br/>
              ${params.summary}
            </div>

            <h2 class="section-title">Indicadores do banco</h2>
            <div class="grid">
              <div class="card">
                <h3>Empreendimentos Ativos</h3>
                <p>${params.developmentsCount}</p>
                <div class="hint">Registros ativos no banco</div>
              </div>

              <div class="card">
                <h3>Lotes Disponíveis</h3>
                <p>${params.lotsAvailable} / ${params.totalLots}</p>
                <div class="hint">Reservados: ${params.lotsReserved} | Vendidos: ${params.lotsSold}</div>
              </div>

              <div class="card">
                <h3>Clientes</h3>
                <p>${params.clientsCount}</p>
                <div class="hint">Cadastros válidos no banco</div>
              </div>

              <div class="card">
                <h3>Pré-atendimentos</h3>
                <p>${params.interestsCount}</p>
                <div class="hint">Convertidos em cliente: ${params.convertedInterests}</div>
              </div>

              <div class="card">
                <h3>Corretores Ativos</h3>
                <p>${params.activeBrokers}</p>
                <div class="hint">Corretores com cadastro ativo</div>
              </div>

              <div class="card">
                <h3>Gráfico</h3>
                <p>${params.chartTitle}</p>
                <div class="hint">Agrupamento com base no período selecionado</div>
              </div>
            </div>

            <h2 class="section-title">Observações</h2>
            <ul>
              ${notes}
            </ul>

            <h2 class="section-title">Pré-atendimentos recentes</h2>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Empreendimento</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th>Origem</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                ${rows || `<tr><td colspan="6">Nenhum registro recente.</td></tr>`}
              </tbody>
            </table>

            <div class="footer-box">
              <div>
                <div class="signature">Responsável pela emissão do relatório</div>
              </div>
              <div>
                <div class="signature">Responsável operacional / aprovação</div>
              </div>
            </div>
          </div>

          <div class="print-actions">
            <button class="btn" onclick="window.print()">Imprimir / Salvar em PDF</button>
            <button class="btn btn-dark" onclick="window.close()">Fechar prévia</button>
          </div>
        </div>
      </body>
    </html>
  `;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<PeriodKey>("Este Mês");
  const [reportOpen, setReportOpen] = useState(false);

  const { data: currentUser, isLoading: userLoading } = useQuery<SafeUser | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const canLoadAdminData = Boolean(currentUser);

  const { data: developments = [], isLoading: developmentsLoading } = useQuery<
    DevelopmentItem[]
  >({
    queryKey: ["/api/admin/developments"],
    retry: false,
    enabled: canLoadAdminData,
  });

  const { data: lots = [], isLoading: lotsLoading } = useQuery<LotItem[]>({
    queryKey: ["/api/admin/lots"],
    retry: false,
    enabled: canLoadAdminData,
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery<ClientItem[]>({
    queryKey: ["/api/admin/clients"],
    retry: false,
    enabled: canLoadAdminData,
  });

  const { data: brokers = [], isLoading: brokersLoading } = useQuery<BrokerItem[]>({
    queryKey: ["/api/admin/brokers"],
    retry: false,
    enabled: canLoadAdminData,
  });

  const { data: interests = [], isLoading: interestsLoading } = useQuery<InterestItem[]>({
    queryKey: ["/api/public/interests"],
    retry: false,
    enabled: canLoadAdminData,
    queryFn: async () => {
      const response = await fetch("/api/public/interests", {
        credentials: "include",
      });

      if (!response.ok) {
        return [];
      }

      const payload = await response.json();
      return Array.isArray(payload) ? payload : [];
    },
  });

  const loading =
    userLoading ||
    developmentsLoading ||
    lotsLoading ||
    clientsLoading ||
    brokersLoading ||
    interestsLoading;

  const metrics = useMemo(() => {
    const activeDevelopments = developments.filter((item) => item.isActive !== false);
    const activeDevelopmentIds = new Set(activeDevelopments.map((item) => item.id));

    /**
     * Regra revisada:
     * Só entram no dashboard os pré-atendimentos vinculados a empreendimentos
     * ativos que ainda existem no banco.
     */
    const validInterests = interests.filter(
      (item) => item.project_id && activeDevelopmentIds.has(item.project_id),
    );

    const totalLots = lots.length;
    const availableLots = lots.filter((item) => item.status === "Disponível").length;
    const reservedLots = lots.filter((item) => item.status === "Reservado").length;
    const soldLots = lots.filter((item) => item.status === "Vendido").length;
    const activeBrokers = brokers.filter((item) => item.isActive).length;
    const convertedInterests = validInterests.filter(
      (item) => item.status === "converted_client",
    ).length;
    const openInterests = validInterests.filter(
      (item) => item.status !== "converted_client",
    ).length;

    const chart = buildChartData(validInterests, period);

    const recentInterests: RecentInterestItem[] = [...validInterests]
      .sort((a, b) => {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        fullName: item.full_name,
        projectName: item.project_name,
        phone: item.phone,
        status: item.status,
        source: item.source,
        createdAt: item.created_at ?? "",
      }));

    const summary = [
      `${activeDevelopments.length} empreendimento(s) ativo(s) registrado(s) no banco.`,
      `${availableLots} lote(s) disponível(is) de um total de ${totalLots}.`,
      `${clients.length} cliente(s) cadastrado(s) e ${validInterests.length} pré-atendimento(s) válido(s) vinculados a empreendimentos ativos.`,
      `${activeBrokers} corretor(es) ativo(s) vinculado(s) à operação.`,
    ].join(" ");

    const notes = [
      `${reservedLots} lote(s) estão reservados e ${soldLots} marcado(s) como vendidos no banco.`,
      `${convertedInterests} pré-atendimento(s) válidos já foram convertidos em cliente.`,
      `${openInterests} pré-atendimento(s) válidos seguem em acompanhamento.`,
      `O gráfico exibido usa apenas registros reais do período selecionado.`,
      `O relatório ignora pré-atendimentos órfãos ou vinculados a empreendimentos removidos.`,
    ];

    return {
      activeDevelopmentsCount: activeDevelopments.length,
      totalLots,
      availableLots,
      reservedLots,
      soldLots,
      clientsCount: clients.length,
      activeBrokers,
      interestsCount: validInterests.length,
      convertedInterests,
      openInterests,
      chartTitle: chart.title,
      chartType: chart.chartType,
      chartData: chart.data,
      recentInterests,
      summary,
      notes,
    };
  }, [developments, lots, clients, brokers, interests, period]);

  function openReportPreview() {
    setReportOpen(true);
  }

  function openPrintablePdfPreview() {
    const newWindow = window.open("", "_blank", "width=1100,height=820");

    if (!newWindow) {
      toast({
        title: "Não foi possível abrir a prévia",
        description: "Libere pop-ups do navegador para gerar o relatório.",
        variant: "destructive",
      });
      return;
    }

    newWindow.document.open();
    newWindow.document.write(
      buildPrintableReport({
        period,
        issuedAt: getCurrentDateTime(),
        developmentsCount: metrics.activeDevelopmentsCount,
        lotsAvailable: metrics.availableLots,
        lotsReserved: metrics.reservedLots,
        lotsSold: metrics.soldLots,
        totalLots: metrics.totalLots,
        clientsCount: metrics.clientsCount,
        activeBrokers: metrics.activeBrokers,
        interestsCount: metrics.interestsCount,
        convertedInterests: metrics.convertedInterests,
        chartTitle: metrics.chartTitle,
        summary: metrics.summary,
        notes: metrics.notes,
        recentInterests: metrics.recentInterests,
      }),
    );
    newWindow.document.close();
  }

  function downloadHtmlReport() {
    const html = buildPrintableReport({
      period,
      issuedAt: getCurrentDateTime(),
      developmentsCount: metrics.activeDevelopmentsCount,
      lotsAvailable: metrics.availableLots,
      lotsReserved: metrics.reservedLots,
      lotsSold: metrics.soldLots,
      totalLots: metrics.totalLots,
      clientsCount: metrics.clientsCount,
      activeBrokers: metrics.activeBrokers,
      interestsCount: metrics.interestsCount,
      convertedInterests: metrics.convertedInterests,
      chartTitle: metrics.chartTitle,
      summary: metrics.summary,
      notes: metrics.notes,
      recentInterests: metrics.recentInterests,
    });

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-smartloteia-${period.toLowerCase().replace(/\s+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast({
      title: "Relatório exportado",
      description: "Arquivo HTML salvo com dados reais do banco.",
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-10 flex items-center justify-center text-slate-500">
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Carregando painel com dados do banco...
            </span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Prévia do Relatório Operacional</DialogTitle>
            <DialogDescription>
              Conteúdo montado somente com registros existentes no banco de dados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 max-h-[75vh] overflow-auto pr-1">
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-emerald-700" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900">SmartloteIA</h2>
                        <p className="text-sm text-slate-500">Relatório Operacional</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl border bg-slate-50 px-3 py-2">
                      <strong>Período:</strong> {period}
                    </div>
                    <div className="rounded-xl border bg-slate-50 px-3 py-2">
                      <strong>Emitido em:</strong> {getCurrentDateTime()}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                  <p className="font-semibold">Resumo</p>
                  <p className="mt-1 text-sm">{metrics.summary}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-500">Empreendimentos Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-black">{metrics.activeDevelopmentsCount}</div>
                  <div className="text-xs text-slate-500 mt-2">Registros reais do banco</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-500">Lotes Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-black">
                    {metrics.availableLots} / {metrics.totalLots}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    Reservados: {metrics.reservedLots} | Vendidos: {metrics.soldLots}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-500">Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-black">{metrics.clientsCount}</div>
                  <div className="text-xs text-slate-500 mt-2">Cadastros reais</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-500">Pré-atendimentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-black">{metrics.interestsCount}</div>
                  <div className="text-xs text-slate-500 mt-2">
                    Convertidos: {metrics.convertedInterests}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Observações operacionais</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-700">
                  {metrics.notes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500"></span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pré-atendimentos recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Nome</th>
                        <th className="text-left py-2">Empreendimento</th>
                        <th className="text-left py-2">Telefone</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Origem</th>
                        <th className="text-left py-2">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.recentInterests.length === 0 ? (
                        <tr>
                          <td className="py-3 text-slate-500" colSpan={6}>
                            Nenhum pré-atendimento válido encontrado para empreendimentos ativos.
                          </td>
                        </tr>
                      ) : (
                        metrics.recentInterests.map((item) => (
                          <tr key={item.id} className="border-b last:border-0">
                            <td className="py-2">{item.fullName}</td>
                            <td className="py-2">{item.projectName}</td>
                            <td className="py-2">{item.phone}</td>
                            <td className="py-2">{getInterestStatusLabel(item.status)}</td>
                            <td className="py-2">{item.source}</td>
                            <td className="py-2">{formatDateTimeBR(item.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3 justify-end">
              <Button variant="outline" onClick={downloadHtmlReport}>
                <FileText className="h-4 w-4 mr-2" />
                Baixar HTML
              </Button>

              <Button variant="outline" onClick={openPrintablePdfPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Abrir Prévia
              </Button>

              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={openPrintablePdfPreview}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir / PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Painel Operacional
          </h1>
          <p className="text-slate-500">
            Visão consolidada apenas com dados existentes no banco de dados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={period} onValueChange={(value) => setPeriod(value as PeriodKey)}>
            <SelectTrigger className="w-[170px] bg-white">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Hoje">Hoje</SelectItem>
              <SelectItem value="Esta Semana">Esta Semana</SelectItem>
              <SelectItem value="Este Mês">Este Mês</SelectItem>
              <SelectItem value="Este Ano">Este Ano</SelectItem>
            </SelectContent>
          </Select>

          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={openReportPreview}
          >
            <Download className="h-4 w-4" />
            Gerar Relatório
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">
              Empreendimentos Ativos
            </CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">
              {metrics.activeDevelopmentsCount}
            </div>
            <p className="text-xs font-medium mt-2 text-slate-500">
              Registros válidos no banco
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">
              Lotes Disponíveis
            </CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <MapPin className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">
              {metrics.availableLots} / {metrics.totalLots}
            </div>
            <p className="text-xs font-medium mt-2 text-slate-500">
              Reservados: {metrics.reservedLots} | Vendidos: {metrics.soldLots}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">
              Clientes
            </CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg">
              <UserRound className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">
              {metrics.clientsCount}
            </div>
            <p className="text-xs font-medium mt-2 text-slate-500">
              Cadastros reais no banco
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden relative border-t-4 border-t-purple-500">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -z-10" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">
              Pré-atendimentos Válidos
            </CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">
              {metrics.interestsCount}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-white text-xs border-slate-200 text-slate-600">
                Convertidos: {metrics.convertedInterests}
              </Badge>
              <Badge variant="outline" className="bg-white text-xs border-slate-200 text-slate-600">
                Em aberto: {metrics.openInterests}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-slate-800">{metrics.chartTitle}</CardTitle>
            <Badge variant="outline" className="w-fit">
              <CalendarDays className="h-3.5 w-3.5 mr-1" />
              Período: {period}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                {metrics.chartType === "area" ? (
                  <AreaChart
                    data={metrics.chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorTotalReal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value: number) => [value, "Registros"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorTotalReal)"
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={metrics.chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value: number) => [value, "Registros"]}
                    />
                    <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="#10b981" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-slate-200 shadow-sm bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-slate-800 flex justify-between items-center">
              Pré-atendimentos Recentes
              <Button
                variant="link"
                className="text-emerald-600 px-0"
                onClick={() => setLocation("/crm")}
              >
                Ver todos
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            {metrics.recentInterests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                Nenhum pré-atendimento válido encontrado para empreendimentos ativos.
              </div>
            ) : (
              <div className="space-y-6">
                {metrics.recentInterests.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-sm font-bold text-slate-800 truncate">
                        {item.fullName}
                      </span>
                      <span className="text-xs font-medium text-slate-500 truncate flex items-center gap-1">
                        <Building className="h-3.5 w-3.5" />
                        {item.projectName}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {item.phone}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-2 py-0.5 font-bold ${getInterestStatusBadgeClass(
                          item.status,
                        )}`}
                      >
                        {getInterestStatusLabel(item.status)}
                      </Badge>
                      <span className="text-[11px] text-slate-500">
                        {formatDateBR(item.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-slate-100">
              <Button
                className="w-full bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => setLocation("/crm")}
              >
                <BriefcaseBusiness className="h-4 w-4 mr-2" />
                Acessar CRM Completo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}