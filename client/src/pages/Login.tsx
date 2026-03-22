import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserRole } from "@shared/schema";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Sparkles,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Bot,
  Send,
  Search,
  LoaderCircle,
  Home,
  Trees,
  BadgeCheck,
  Landmark,
  MessageSquareMore,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

type ProjectItem = {
  id: string;
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
};

type InterviewKey =
  | "fullName"
  | "phone"
  | "email"
  | "cityInterest"
  | "objective"
  | "budgetRange"
  | "timeline"
  | "familyProfile";

type InterviewStep = {
  key: InterviewKey;
  prompt: (project: ProjectItem) => string;
};

const interviewSteps: InterviewStep[] = [
  {
    key: "fullName",
    prompt: (project) =>
      `Perfeito. Vamos iniciar a pré-análise comercial para o empreendimento "${project.name}". Qual seu nome completo?`,
  },
  {
    key: "phone",
    prompt: () => "Qual seu WhatsApp com DDD para contato do corretor?",
  },
  {
    key: "email",
    prompt: () =>
      "Qual seu melhor e-mail? Se preferir, pode responder 'não tenho'.",
  },
  {
    key: "cityInterest",
    prompt: () =>
      "Em qual cidade ou região você pretende comprar ou investir?",
  },
  {
    key: "objective",
    prompt: () =>
      "Seu objetivo principal é morar, investir, revender ou ainda está avaliando?",
  },
  {
    key: "budgetRange",
    prompt: () =>
      "Qual faixa de investimento você considera hoje para essa compra?",
  },
  {
    key: "timeline",
    prompt: () =>
      "Você pretende fechar em quanto tempo: imediato, 30 dias, 90 dias ou mais?",
  },
  {
    key: "familyProfile",
    prompt: () =>
      "Conte rapidamente seu perfil: profissão, idade, filhos ou estilo de vida. Isso ajuda a IA a qualificar melhor seu atendimento.",
  },
];

function getHomePathByRole(role: UserRole) {
  switch (role) {
    case "admin":
      return "/dashboard";
    case "manager":
      return "/dashboard";
    case "broker":
      return "/vendas";
    case "financial":
      return "/financeiro";
    default:
      return "/dashboard";
  }
}

export default function PublicPortal() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [aiChat, setAiChat] = useState<{ role: "ai" | "user"; text: string }[]>([
    {
      role: "ai",
      text: "Olá! Sou a Inteligência Artificial do Smartlote. Posso te ajudar a encontrar o lote ideal ou iniciar uma entrevista comercial para um empreendimento específico.",
    },
  ]);
  const [aiInput, setAiInput] = useState("");

  const [interviewActive, setInterviewActive] = useState(false);
  const [submittingInterview, setSubmittingInterview] = useState(false);
  const [interviewStepIndex, setInterviewStepIndex] = useState(0);
  const [interviewProject, setInterviewProject] = useState<ProjectItem | null>(null);
  const [interviewAnswers, setInterviewAnswers] = useState<
    Partial<Record<InterviewKey, string>>
  >({});

  const { data: projects = [], isLoading: projectsLoading } = useQuery<ProjectItem[]>({
    queryKey: ["/api/public/developments"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/public/developments", {
          credentials: "include",
        });

        if (!response.ok) {
          return [];
        }

        const payload = await response.json();
        return Array.isArray(payload) ? payload : [];
      } catch {
        return [];
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return projects;

    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(term) ||
        project.city.toLowerCase().includes(term) ||
        project.type.toLowerCase().includes(term) ||
        project.status.toLowerCase().includes(term)
      );
    });
  }, [projects, searchTerm]);

  function scrollToAiPanel() {
    setTimeout(() => {
      document
        .getElementById("smartia-interview")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        login,
        password,
      });

      const payload = await response.json();

      queryClient.setQueryData(["/api/auth/me"], payload.user);
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

      toast({
        title: "Acesso liberado",
        description: `Bem-vindo ao SmartloteIA, ${payload.user.name}.`,
      });

      setLocation(getHomePathByRole(payload.user.role));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.replace(/^\d+:\s*/, "")
          : "Não foi possível autenticar.";

      toast({
        title: "Falha no login",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleOpenDetails(project: ProjectItem) {
    setSelectedProject(project);
    setDetailsOpen(true);
  }

  function startCommercialInterview(project: ProjectItem) {
    setDetailsOpen(false);
    setInterviewProject(project);
    setInterviewActive(true);
    setInterviewStepIndex(0);
    setInterviewAnswers({});
    setAiInput("");

    setAiChat([
      {
        role: "ai",
        text: `Ótimo. Vou iniciar uma entrevista prévia para o empreendimento "${project.name}". Isso ajuda o time comercial a entender seu perfil antes do primeiro contato.`,
      },
      {
        role: "ai",
        text: interviewSteps[0].prompt(project),
      },
    ]);

    scrollToAiPanel();

    toast({
      title: "Entrevista comercial iniciada",
      description: `A SmartIA vai qualificar seu interesse em ${project.name}.`,
    });
  }

  async function submitCommercialInterview(
    project: ProjectItem,
    answers: Partial<Record<InterviewKey, string>>,
  ) {
    setSubmittingInterview(true);

    try {
      const response = await apiRequest("POST", "/api/public/interests", {
        projectId: String(project.id),
        projectName: project.name,
        source: "landing_ai",
        fullName: answers.fullName ?? "",
        phone: answers.phone ?? "",
        email:
          answers.email && answers.email.toLowerCase() !== "não tenho"
            ? answers.email
            : null,
        cityInterest: answers.cityInterest ?? null,
        objective: answers.objective ?? null,
        budgetRange: answers.budgetRange ?? null,
        timeline: answers.timeline ?? null,
        familyProfile: answers.familyProfile ?? null,
        notes: `Pré-atendimento iniciado pela IA pública do SmartloteIA para o empreendimento ${project.name}.`,
      });

      const payload = await response.json();

      setAiChat((prev) => [
        ...prev,
        {
          role: "ai",
          text: `Perfeito. Seu pré-atendimento foi registrado com sucesso sob o protocolo ${payload.reference}. Um consultor comercial poderá assumir esse atendimento já com seu perfil qualificado.`,
        },
      ]);

      toast({
        title: "Pré-atendimento registrado",
        description: `Protocolo ${payload.reference} gerado com sucesso.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.replace(/^\d+:\s*/, "")
          : "Falha ao salvar o pré-atendimento.";

      setAiChat((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Não consegui concluir o registro do pré-atendimento agora. Tente novamente em instantes ou use o atendimento comercial direto.",
        },
      ]);

      toast({
        title: "Erro ao registrar atendimento",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmittingInterview(false);
      setInterviewActive(false);
      setInterviewStepIndex(0);
      setInterviewProject(null);
      setInterviewAnswers({});
    }
  }

  async function handleAiChat(e: React.FormEvent) {
    e.preventDefault();

    const value = aiInput.trim();
    if (!value) return;

    setAiChat((prev) => [...prev, { role: "user", text: value }]);
    setAiInput("");

    if (interviewActive && interviewProject) {
      const currentStep = interviewSteps[interviewStepIndex];
      const nextAnswers = {
        ...interviewAnswers,
        [currentStep.key]: value,
      };

      setInterviewAnswers(nextAnswers);

      const nextStepIndex = interviewStepIndex + 1;

      if (nextStepIndex < interviewSteps.length) {
        setInterviewStepIndex(nextStepIndex);
        setAiChat((prev) => [
          ...prev,
          {
            role: "ai",
            text: interviewSteps[nextStepIndex].prompt(interviewProject),
          },
        ]);
        return;
      }

      await submitCommercialInterview(interviewProject, nextAnswers);
      return;
    }

    setTimeout(() => {
      setAiChat((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Posso te ajudar de duas formas: sugerindo um empreendimento pelo seu perfil ou iniciando uma entrevista comercial completa a partir do botão de detalhes do empreendimento.",
        },
      ]);
    }, 700);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-200">
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl overflow-hidden p-0">
          {selectedProject && (
            <div className="bg-white">
              <div className="relative h-64 md:h-80">
                <img
                  src={selectedProject.img}
                  alt={selectedProject.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/35 to-transparent"></div>

                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <Badge className="bg-white/90 text-slate-900 hover:bg-white border-0">
                    {selectedProject.type}
                  </Badge>
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 border-0">
                    {selectedProject.status}
                  </Badge>
                </div>

                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-2xl md:text-3xl text-white font-black">
                      {selectedProject.name}
                    </DialogTitle>
                    <DialogDescription className="text-slate-200 flex items-center gap-2 pt-1">
                      <MapPin className="h-4 w-4" />
                      {selectedProject.city}
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-slate-200 shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                          <Landmark className="h-5 w-5 text-emerald-700" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                            Condição comercial
                          </p>
                          <p className="text-sm font-bold text-slate-800">
                            {selectedProject.price}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                          <Home className="h-5 w-5 text-blue-700" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                            Dimensão
                          </p>
                          <p className="text-sm font-bold text-slate-800">
                            {selectedProject.area}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                          <BadgeCheck className="h-5 w-5 text-amber-700" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                            Financiamento
                          </p>
                          <p className="text-sm font-bold text-slate-800">
                            {selectedProject.financing}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
                  <Card className="border-slate-200 shadow-none">
                    <CardHeader>
                      <CardTitle className="text-slate-900">
                        Sobre o empreendimento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-slate-700 leading-relaxed">
                        {selectedProject.description}
                      </p>

                      <div>
                        <p className="text-sm font-bold text-slate-800 mb-3">
                          Diferenciais
                        </p>
                        <ul className="space-y-2">
                          {selectedProject.highlights.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                              <Trees className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-emerald-200 bg-emerald-50 shadow-none">
                    <CardHeader>
                      <CardTitle className="text-slate-900">Próximo passo</CardTitle>
                      <CardDescription>
                        A IA pode fazer uma entrevista prévia e enviar seu perfil pronto para o comercial.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-2xl bg-white border border-emerald-100 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                          Empreendimento selecionado
                        </p>
                        <p className="text-lg font-black text-slate-900 mt-1">
                          {selectedProject.name}
                        </p>
                        <p className="text-sm text-emerald-700 font-semibold mt-1">
                          {selectedProject.price}
                        </p>
                      </div>

                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => startCommercialInterview(selectedProject)}
                      >
                        <MessageSquareMore className="h-4 w-4 mr-2" />
                        Solicitar atendimento comercial
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full border-slate-300"
                        onClick={() => setDetailsOpen(false)}
                      >
                        Fechar detalhes
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">
              SmartloteIA
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-slate-500 hover:text-slate-700 gap-2 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <Lock className="w-4 h-4" />
                  <span className="hidden sm:inline">Acesso Restrito</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl">
                <div className="p-8 bg-slate-900 text-white relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-bl-full blur-2xl"></div>

                  <DialogHeader>
                    <DialogTitle className="text-2xl text-white">
                      Acessar o Sistema
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Área restrita para administrador, gestor, corretor e financeiro.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleLogin} className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="login" className="text-slate-300">
                        Usuário ou e-mail corporativo
                      </Label>
                      <Input
                        id="login"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        placeholder="Seu usuário ou e-mail cadastrado"
                        className="bg-slate-800 border-slate-700 text-white focus-visible:ring-emerald-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-300">
                        Senha
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white focus-visible:ring-emerald-500"
                        required
                      />
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      Use o usuário cadastrado pelo administrador do sistema.
                    </div>

                    <Button
                      type="submit"
                      className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="inline-flex items-center gap-2">
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Autenticando...
                        </span>
                      ) : (
                        "Entrar no Painel"
                      )}
                    </Button>
                  </form>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md rounded-full px-6"
              onClick={scrollToAiPanel}
            >
              Fale com um Corretor
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative isolate py-20 lg:py-32 overflow-hidden">
          <img
            src="/fundo-smartlote.png"
            alt="Fundo SmartloteIA"
            className="absolute inset-0 z-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 z-10 bg-slate-900/35"></div>
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-900/75 via-slate-900/20 to-transparent"></div>

          <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge
              variant="outline"
              className="border-emerald-500/50 text-emerald-300 bg-emerald-500/10 mb-6 px-4 py-1.5 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              O futuro do seu patrimônio começa aqui
            </Badge>

            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
              Construa sua história no <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-100">
                lugar perfeito.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto mb-10">
              Conheça nossos loteamentos exclusivos e descubra o endereço ideal
              para construir a casa dos seus sonhos ou investir com alta
              rentabilidade.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
          <div className="lg:col-span-8 space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="text-emerald-500" />
                Loteamentos Disponíveis
              </h2>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar cidade, nome ou tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 rounded-full w-full sm:w-64"
                />
              </div>
            </div>

            {projectsLoading ? (
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-8 flex items-center justify-center text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Carregando empreendimentos...
                  </span>
                </CardContent>
              </Card>
            ) : filteredProjects.length === 0 ? (
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-10 text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <Building2 className="w-7 h-7 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Nenhum empreendimento cadastrado
                  </h3>
                  <p className="text-slate-500 mt-2">
                    No momento, a vitrine pública não possui empreendimentos disponíveis.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="overflow-hidden border-slate-200 shadow-md group hover:shadow-xl transition-all duration-300 bg-white"
                  >
                    <div className="h-48 w-full overflow-hidden relative">
                      <img
                        src={project.img}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>

                      <Badge className="absolute top-3 right-3 bg-white/90 text-slate-900 hover:bg-white backdrop-blur-sm border-0 font-bold">
                        {project.type}
                      </Badge>

                      <div className="absolute bottom-3 left-3 text-white">
                        <h3 className="font-bold text-lg leading-tight">
                          {project.name}
                        </h3>
                        <p className="text-xs font-medium text-slate-300 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {project.city}
                        </p>
                      </div>
                    </div>

                    <CardContent className="p-5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Condições
                        </p>
                        <p className="font-black text-emerald-600">
                          {project.price}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-slate-300 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200 transition-colors"
                        onClick={() => handleOpenDetails(project)}
                      >
                        Detalhes
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card className="bg-amber-50 border-amber-200 shadow-sm mt-8 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>

              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-8 h-8 text-amber-600" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      Atenção na Compra de Imóveis
                    </h3>

                    <ul className="space-y-3 text-slate-700 font-medium">
                      <li className="flex items-start gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>
                          <strong>Verifique o Registro:</strong> Exija a certidão
                          da matrícula do loteamento no Cartório de Registro de
                          Imóveis. Loteamento não registrado é ilegal.
                        </span>
                      </li>

                      <li className="flex items-start gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>
                          <strong>Consulte a Prefeitura:</strong> Confirme se o
                          projeto foi aprovado pelos órgãos públicos e se há
                          licença ambiental.
                        </span>
                      </li>

                      <li className="flex items-start gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>
                          <strong>Desconfie de promessas verbais:</strong> Tudo o
                          que o corretor prometer deve constar no contrato de
                          compra e venda.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card
              id="smartia-interview"
              className="border-emerald-200 shadow-xl bg-white h-full flex flex-col relative overflow-hidden sticky top-28"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 pt-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <Bot className="w-6 h-6" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  </div>

                  <div>
                    <CardTitle className="text-lg text-slate-800">
                      SmartIA
                    </CardTitle>
                    <CardDescription className="text-emerald-600 font-medium text-xs">
                      Seu consultor virtual 24h
                    </CardDescription>
                  </div>
                </div>

                {interviewProject && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white border border-emerald-200 flex items-center justify-center">
                        <UserRound className="h-4 w-4 text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">
                          Entrevista ativa
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {interviewProject.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-0 flex-1 flex flex-col h-[540px]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                  {aiChat.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                          msg.role === "ai"
                            ? "bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-none"
                            : "bg-emerald-600 text-white rounded-tr-none shadow-md"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-white border-t border-slate-100">
                  <form onSubmit={handleAiChat} className="flex gap-2">
                    <Input
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder={
                        interviewActive
                          ? "Responda a pergunta da IA..."
                          : "Ex: Tenho 35 anos, sou médico..."
                      }
                      className="bg-slate-50 border-slate-200 rounded-full focus-visible:ring-emerald-500"
                      disabled={submittingInterview}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="rounded-full bg-emerald-600 hover:bg-emerald-700 shrink-0"
                      disabled={submittingInterview}
                    >
                      {submittingInterview ? (
                        <LoaderCircle className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>

                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    {interviewActive
                      ? "A SmartIA está qualificando seu perfil para o atendimento comercial."
                      : "Clique em Detalhes e depois em Solicitar atendimento comercial para iniciar a triagem inteligente."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 py-12 border-t border-slate-800 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-slate-400 font-medium">
            SmartloteIA © 2026. Todos os direitos reservados.
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Plataforma inteligente de gestão e vendas de loteamentos.
          </p>
        </div>
      </footer>
    </div>
  );
}