import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, FileEdit, Trash2, Mail, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const initialClientsData = [
  { id: '1', name: 'João Silva', cpf: '123.456.789-00', email: 'joao@email.com', phone: '(11) 98765-4321', status: 'Ativo', date: '10/03/2026', contracts: 1 },
  { id: '2', name: 'Maria Santos Oliveira', cpf: '234.567.890-11', email: 'maria.santos@email.com', phone: '(11) 97654-3210', status: 'Ativo', date: '08/03/2026', contracts: 2 },
  { id: '3', name: 'Carlos Ferreira', cpf: '345.678.901-22', email: 'carlos.f@email.com', phone: '(11) 96543-2109', status: 'Inativo', date: '05/03/2026', contracts: 0 },
  { id: '4', name: 'Ana Costa', cpf: '456.789.012-33', email: 'ana.costa@email.com', phone: '(11) 95432-1098', status: 'Ativo', date: '01/03/2026', contracts: 1 },
];

export default function Clients() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState(initialClientsData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', cpf: '', email: '', phone: '' });

  // Add edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  const handleCreateClient = () => {
    if (!newClient.name) return;
    
    const clientToAdd = {
      id: `${clients.length + 1}`,
      name: newClient.name,
      cpf: newClient.cpf || '000.000.000-00',
      email: newClient.email || 'email@exemplo.com',
      phone: newClient.phone || '(00) 00000-0000',
      status: 'Ativo',
      date: new Date().toLocaleDateString('pt-BR'),
      contracts: 0
    };
    
    setClients([clientToAdd, ...clients]);
    setNewClient({ name: '', cpf: '', email: '', phone: '' });
    setIsDialogOpen(false);
    toast({
      title: "Cliente Cadastrado",
      description: "O novo cliente foi adicionado com sucesso.",
    });
  };

  const openEditDialog = (client: any) => {
    setEditingClient({...client});
    setIsEditDialogOpen(true);
  };

  const handleEditClient = () => {
    if (!editingClient || !editingClient.name) return;
    
    setClients(clients.map(c => c.id === editingClient.id ? editingClient : c));
    setIsEditDialogOpen(false);
    toast({
      title: "Ficha Atualizada",
      description: "Os dados do cliente foram atualizados com sucesso.",
    });
  };

  const handleArchive = (id: string) => {
    setClients(clients.filter(c => c.id !== id));
    toast({
      title: "Cliente Arquivado",
      description: "O cliente foi removido da lista principal.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Carteira de Clientes</h1>
          <p className="text-slate-500">Gestão centralizada de compradores e prospects.</p>
        </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                <Plus className="h-4 w-4" /> Novo Cadastro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
                <DialogDescription>
                  Cadastre um novo lead ou cliente na base.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input placeholder="Ex: João da Silva" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input placeholder="000.000.000-00" value={newClient.cpf} onChange={e => setNewClient({...newClient, cpf: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input placeholder="email@exemplo.com" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone / WhatsApp</Label>
                  <Input placeholder="(11) 99999-9999" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreateClient}>Salvar Cliente</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Cliente</DialogTitle>
                <DialogDescription>
                  Atualize os dados do cliente na base.
                </DialogDescription>
              </DialogHeader>
              {editingClient && (
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input value={editingClient.name} onChange={e => setEditingClient({...editingClient, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF</Label>
                    <Input value={editingClient.cpf} onChange={e => setEditingClient({...editingClient, cpf: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input value={editingClient.email} onChange={e => setEditingClient({...editingClient, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone / WhatsApp</Label>
                    <Input value={editingClient.phone} onChange={e => setEditingClient({...editingClient, phone: e.target.value})} />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleEditClient}>Atualizar Cliente</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

      <Card className="shadow-sm border-slate-200 bg-white">
        <CardHeader className="p-4 border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, CPF ou email..."
                className="pl-9 bg-slate-50 border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2 bg-white text-slate-700">
              <Filter className="h-4 w-4" /> Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-slate-200">
                <TableHead className="font-bold text-slate-600">Cliente</TableHead>
                <TableHead className="font-bold text-slate-600">Documento</TableHead>
                <TableHead className="hidden md:table-cell font-bold text-slate-600">Contato</TableHead>
                <TableHead className="font-bold text-slate-600 text-center">Contratos</TableHead>
                <TableHead className="font-bold text-slate-600">Status</TableHead>
                <TableHead className="text-right font-bold text-slate-600">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-slate-50 transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-slate-200">
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                          {client.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{client.name}</span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cad: {client.date}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-600">{client.cpf}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {client.phone}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail className="w-3 h-3 text-slate-400" /> {client.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold border-0">
                      {client.contracts}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-bold border-0 ${
                      client.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="font-medium text-slate-700 cursor-pointer" onClick={() => openEditDialog(client)}>
                            <FileEdit className="mr-2 h-4 w-4 text-slate-400" /> Editar Ficha
                          </DropdownMenuItem>
                          <DropdownMenuItem className="font-medium text-slate-700">
                            <Phone className="mr-2 h-4 w-4 text-slate-400" /> Ver Histórico
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700 font-medium cursor-pointer" onClick={() => handleArchive(client.id)}>
                            <Trash2 className="mr-2 h-4 w-4 text-red-500" /> Arquivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}