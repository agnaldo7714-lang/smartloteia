import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Sparkles, MapPin, ShieldAlert, ArrowRight, ShieldCheck, Lock, Bot, Send, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const projectsData = [
  { id: 1, name: 'Residencial Bosque das Águas', city: 'São Paulo/SP', type: 'Alto Padrão', price: 'A partir de R$ 180.000', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop' },
  { id: 2, name: 'Jardins do Sul', city: 'Campinas/SP', type: 'Bairro Planejado', price: 'A partir de R$ 125.000', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2064&auto=format&fit=crop' },
  { id: 3, name: 'Valle Verde', city: 'Ribeirão Preto/SP', type: 'Condomínio Fechado', price: 'A partir de R$ 210.000', img: 'https://images.unsplash.com/photo-1448630360428-65456885c650?q=80&w=2067&auto=format&fit=crop' },
];

export default function PublicPortal() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [aiChat, setAiChat] = useState<{role: 'ai'|'user', text: string}[]>([
    { role: 'ai', text: 'Olá! Sou a Inteligência Artificial do Smartlote. Me conte um pouco sobre você (idade, profissão, se tem filhos) e o que busca, que eu encontro o lote perfeito!' }
  ]);
  const [aiInput, setAiInput] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLocation("/dashboard");
    }, 800);
  };

  const handleAiChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    
    setAiChat(prev => [...prev, { role: 'user', text: aiInput }]);
    setAiInput("");
    
    setTimeout(() => {
      setAiChat(prev => [...prev, { 
        role: 'ai', 
        text: 'Analisando seu perfil... Identifiquei que o "Jardins do Sul" é a melhor opção para sua família! Ele tem excelente infraestrutura e área de lazer segura para crianças, além de parcelas que cabem no seu orçamento. Quer que um corretor te chame no WhatsApp para apresentar os lotes disponíveis?' 
      }]);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-200">
      {/* Navbar Pública */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">Smartlote</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-slate-400 hover:text-slate-600 gap-2 opacity-50 hover:opacity-100 transition-opacity">
                  <Lock className="w-4 h-4" /> <span className="hidden sm:inline">Acesso Restrito</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl">
                <div className="p-8 bg-slate-900 text-white relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-bl-full blur-2xl"></div>
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-white">Acessar o Sistema</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Área restrita para corretores e administradores.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleLogin} className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300">E-mail corporativo</Label>
                      <Input id="email" type="email" placeholder="admin@smartlote.com" className="bg-slate-800 border-slate-700 text-white focus-visible:ring-emerald-500" required defaultValue="admin@smartlote.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-300">Senha</Label>
                      <Input id="password" type="password" className="bg-slate-800 border-slate-700 text-white focus-visible:ring-emerald-500" required defaultValue="123456" />
                    </div>
                    <Button type="submit" className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold" disabled={loading}>
                      {loading ? "Autenticando..." : "Entrar no Painel"}
                    </Button>
                  </form>
                </div>
              </DialogContent>
            </Dialog>

            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md rounded-full px-6">
              Fale com um Corretor
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900 -z-20"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay -z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent -z-10"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 mb-6 px-4 py-1.5 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              O futuro do seu patrimônio começa aqui
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
              Construa sua história no <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">lugar perfeito.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
              Conheça nossos loteamentos exclusivos e descubra o endereço ideal para construir a casa dos seus sonhos ou investir com alta rentabilidade.
            </p>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
          
          {/* Loteamentos em Destaque */}
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="text-emerald-500" />
                Loteamentos Disponíveis
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Buscar cidade..." className="pl-9 bg-slate-50 border-slate-200 rounded-full w-48" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {projectsData.map(project => (
                <Card key={project.id} className="overflow-hidden border-slate-200 shadow-md group hover:shadow-xl transition-all duration-300 bg-white">
                  <div className="h-48 w-full overflow-hidden relative">
                    <img src={project.img} alt={project.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                    <Badge className="absolute top-3 right-3 bg-white/90 text-slate-900 hover:bg-white backdrop-blur-sm border-0 font-bold">
                      {project.type}
                    </Badge>
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="font-bold text-lg leading-tight">{project.name}</h3>
                      <p className="text-xs font-medium text-slate-300 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {project.city}
                      </p>
                    </div>
                  </div>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Condições</p>
                      <p className="font-black text-emerald-600">{project.price}</p>
                    </div>
                    <Button variant="outline" className="rounded-full border-slate-300 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200 transition-colors">
                      Detalhes
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Secão de Atenção / Educacional */}
            <Card className="bg-amber-50 border-amber-200 shadow-sm mt-8 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-8 h-8 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Atenção na Compra de Imóveis</h3>
                    <ul className="space-y-3 text-slate-700 font-medium">
                      <li className="flex items-start gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Verifique o Registro:</strong> Exija a certidão da matrícula do loteamento no Cartório de Registro de Imóveis. Loteamento não registrado é ilegal.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Consulte a Prefeitura:</strong> Confirme se o projeto foi aprovado pelos órgãos públicos e se há licença ambiental.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Desconfie de promessas verbais:</strong> Tudo o que o corretor prometer (asfalto, água, clube) deve constar no contrato de compra e venda.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Matchmaker Sidebar */}
          <div className="lg:col-span-4">
            <Card className="border-emerald-200 shadow-xl bg-white h-full flex flex-col relative overflow-hidden sticky top-28">
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
                    <CardTitle className="text-lg text-slate-800">SmartIA</CardTitle>
                    <CardDescription className="text-emerald-600 font-medium text-xs">Seu consultor virtual 24h</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 flex-1 flex flex-col h-[500px]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                  {aiChat.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'ai' 
                          ? 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-none' 
                          : 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                      }`}>
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
                      placeholder="Ex: Tenho 35 anos, sou médico..." 
                      className="bg-slate-50 border-slate-200 rounded-full focus-visible:ring-emerald-500"
                    />
                    <Button type="submit" size="icon" className="rounded-full bg-emerald-600 hover:bg-emerald-700 shrink-0">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    Nossa IA cruza seu perfil com nossos lotes disponíveis para fazer a melhor sugestão.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
      
      {/* Footer Público */}
      <footer className="bg-slate-900 py-12 border-t border-slate-800 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-slate-400 font-medium">Smartlote © 2026. Todos os direitos reservados.</p>
          <p className="text-slate-500 text-sm mt-2">Plataforma inteligente de gestão e vendas de loteamentos.</p>
        </div>
      </footer>
    </div>
  );
}