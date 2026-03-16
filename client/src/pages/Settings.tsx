import { useState } from "react";
import { Plus, Search, Filter, Layers, UserPlus, MapPin, CheckCircle2, Shield, UserCog, UserCheck, Trash2, Edit2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialUsersData = [
  { id: 1, name: 'Carlos Diretor', role: 'Administrador', email: 'carlos@smartlote.com', status: 'Ativo', avatar: 'https://i.pravatar.cc/150?u=admin' },
  { id: 2, name: 'João Silva', role: 'Corretor', email: 'joao.corretor@email.com', status: 'Ativo', avatar: 'https://i.pravatar.cc/150?u=joao' },
  { id: 3, name: 'Mariana Costa', role: 'Financeiro', email: 'mariana.fin@smartlote.com', status: 'Ativo', avatar: 'https://i.pravatar.cc/150?u=mari' },
  { id: 4, name: 'Pedro Alves', role: 'Corretor', email: 'pedro@email.com', status: 'Inativo', avatar: 'https://i.pravatar.cc/150?u=pedro' },
];

const projectsData = [
  { id: 1, name: 'Residencial Bosque das Águas', city: 'São Paulo/SP', totalLots: 450, available: 148, status: 'Lançamento', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop' },
  { id: 2, name: 'Jardins do Sul', city: 'Campinas/SP', totalLots: 320, available: 45, status: 'Pronto', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2064&auto=format&fit=crop' },
  { id: 3, name: 'Valle Verde', city: 'Ribeirão Preto/SP', totalLots: 600, available: 600, status: 'Breve Lançamento', img: 'https://images.unsplash.com/photo-1448630360428-65456885c650?q=80&w=2067&auto=format&fit=crop' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState(initialUsersData);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Corretor' });
  
  const [projects, setProjects] = useState(projectsData);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', city: '', totalLots: '' });

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email) return;

    const roleName = newUser.role === 'admin' ? 'Administrador' : 
                     newUser.role === 'financeiro' ? 'Financeiro' : 
                     newUser.role === 'gerente' ? 'Gerente' : 'Corretor';

    const userToAdd = {
      id: users.length + 1,
      name: newUser.name,
      email: newUser.email,
      role: roleName,
      status: 'Ativo',
      avatar: `https://i.pravatar.cc/150?u=${newUser.email}`
    };

    setUsers([userToAdd, ...users]);
    setNewUser({ name: '', email: '', role: 'Corretor' });
    setIsUserDialogOpen(false);
  };

  const handleRemoveUser = (id: number) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const handleCreateProject = () => {
    if (!newProject.name || !newProject.city || !newProject.totalLots) return;

    const projectToAdd = {
      id: projects.length + 1,
      name: newProject.name,
      city: newProject.city,
      totalLots: parseInt(newProject.totalLots),
      available: parseInt(newProject.totalLots),
      status: 'Breve Lançamento',
      img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop'
    };

    setProjects([projectToAdd, ...projects]);
    setNewProject({ name: '', city: '', totalLots: '' });
    setIsProjectDialogOpen(false);
  };

  const handleRemoveProject = (id: number) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Configurações & Cadastros</h1>
          <p className="text-slate-500">Gerencie usuários, perfis, novos loteamentos e sistema.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 w-full justify-start overflow-x-auto">
          <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-white">
            <UserCog className="w-4 h-4" /> Usuários e Perfis
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2 data-[state=active]:bg-white">
            <MapPin className="w-4 h-4" /> Empreendimentos
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-white">
            <ShieldAlert className="w-4 h-4" /> Segurança e Acessos
          </TabsTrigger>
        </TabsList>

        {/* Tab: Usuários (Corretores e Admins) */}
        <TabsContent value="users" className="space-y-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Equipe e Usuários</CardTitle>
                <CardDescription>Cadastre e gerencie corretores, gerentes e administradores.</CardDescription>
              </div>
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    <UserPlus className="w-4 h-4" /> Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Adicione um corretor, administrador ou funcionário do financeiro.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome Completo</Label>
                        <Input 
                          placeholder="Ex: João da Silva" 
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CPF</Label>
                        <Input placeholder="000.000.000-00" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email Corporativo</Label>
                      <Input 
                        type="email" 
                        placeholder="nome@empresa.com.br" 
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Perfil de Acesso</Label>
                      <Select 
                        value={newUser.role} 
                        onValueChange={(val) => setNewUser({...newUser, role: val})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o perfil" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador (Acesso Total)</SelectItem>
                          <SelectItem value="corretor">Corretor (Vendas e Simulação)</SelectItem>
                          <SelectItem value="gerente">Gerente de Vendas</SelectItem>
                          <SelectItem value="financeiro">Financeiro (Acesso Restrito)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Senha Inicial</Label>
                        <Input type="password" placeholder="******" />
                      </div>
                      <div className="space-y-2">
                        <Label>CRECI (Se corretor)</Label>
                        <Input placeholder="Ex: 12345-F" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>Cancelar</Button>
                    <Button className="bg-emerald-600" onClick={handleCreateUser}>Salvar Cadastro</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`
                          ${user.role === 'Administrador' ? 'bg-purple-100 text-purple-700 border-purple-200' : ''}
                          ${user.role === 'Corretor' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
                          ${user.role === 'Financeiro' ? 'bg-amber-100 text-amber-700 border-amber-200' : ''}
                          ${user.role === 'Gerente' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : ''}
                        `}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'Ativo' ? 'default' : 'secondary'} className={user.status === 'Ativo' ? 'bg-emerald-500' : 'bg-slate-300 text-slate-700'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500"><Edit2 className="h-4 w-4" /></Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                            onClick={() => handleRemoveUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Empreendimentos (Lançar loteamento) */}
        <TabsContent value="projects" className="space-y-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Gestão de Loteamentos</CardTitle>
                <CardDescription>Cadastre novos empreendimentos, mapas e lotes.</CardDescription>
              </div>
              <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    <MapPin className="w-4 h-4" /> Lançar Empreendimento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Lançamento de Novo Loteamento</DialogTitle>
                    <DialogDescription>
                      Insira as informações base do novo projeto imobiliário.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-5 py-4">
                    <div className="space-y-2">
                      <Label>Nome do Empreendimento</Label>
                      <Input 
                        placeholder="Ex: Residencial Flores do Campo" 
                        value={newProject.name}
                        onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>CNPJ / SPE (Opcional)</Label>
                        <Input placeholder="00.000.000/0001-00" />
                      </div>
                      <div className="space-y-2">
                        <Label>Cidade / Estado</Label>
                        <Input 
                          placeholder="São Paulo/SP" 
                          value={newProject.city}
                          onChange={(e) => setNewProject({...newProject, city: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Total de Lotes</Label>
                        <Input 
                          type="number" 
                          placeholder="Ex: 500" 
                          value={newProject.totalLots}
                          onChange={(e) => setNewProject({...newProject, totalLots: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tamanho Padrão (m²)</Label>
                        <Input type="number" placeholder="Ex: 250" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição / Infraestrutura</Label>
                      <Textarea placeholder="Descreva os diferenciais: asfalto, energia, portaria..." rows={3} />
                    </div>

                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 gap-2">
                      <Layers className="w-8 h-8 text-slate-400" />
                      <p className="text-sm font-medium text-slate-600">Importar Mapa Interativo (.DWG, .DXF, SVG)</p>
                      <p className="text-xs text-slate-400 text-center">Nossa equipe técnica fará a vetorização do mapa para gerar os lotes interativos do espelho de vendas.</p>
                      <Button variant="outline" size="sm" className="mt-2">Escolher Arquivo</Button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 sticky bottom-0 bg-white pt-4 pb-2 border-t mt-4">
                    <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>Cancelar</Button>
                    <Button className="bg-emerald-600" onClick={handleCreateProject}>Salvar e Continuar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className="overflow-hidden shadow-md border-slate-200 group">
                    <div className="h-32 w-full overflow-hidden relative">
                      <img src={project.img} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <Badge className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm">
                        {project.status}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg text-slate-900 mb-1">{project.name}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1 mb-4">
                        <MapPin className="w-3.5 h-3.5" /> {project.city}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-xs text-slate-500">Lotes Totais</p>
                          <p className="font-bold text-slate-800">{project.totalLots}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Disponíveis</p>
                          <p className="font-bold text-emerald-600">{project.available}</p>
                        </div>
                      </div>
                    </CardContent>
                    <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-between gap-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-white text-xs">Editar Lotes</Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                        onClick={() => handleRemoveProject(project.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}