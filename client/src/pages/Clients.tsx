import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, FileEdit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const clientsData = [
  { id: '1', name: 'João Silva', cpf: '123.456.789-00', email: 'joao@email.com', phone: '(11) 98765-4321', status: 'Ativo', date: '10/03/2026' },
  { id: '2', name: 'Maria Santos Oliveira', cpf: '234.567.890-11', email: 'maria.santos@email.com', phone: '(11) 97654-3210', status: 'Ativo', date: '08/03/2026' },
  { id: '3', name: 'Carlos Ferreira', cpf: '345.678.901-22', email: 'carlos.f@email.com', phone: '(11) 96543-2109', status: 'Inativo', date: '05/03/2026' },
  { id: '4', name: 'Ana Costa', cpf: '456.789.012-33', email: 'ana.costa@email.com', phone: '(11) 95432-1098', status: 'Ativo', date: '01/03/2026' },
  { id: '5', name: 'Pedro Alves', cpf: '567.890.123-44', email: 'pedro@email.com', phone: '(11) 94321-0987', status: 'Ativo', date: '28/02/2026' },
];

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua carteira de clientes compradores.</p>
        </div>
        <Button className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <Card className="glass-panel border-0 shadow-sm">
        <CardHeader className="p-4 border-b pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" /> Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead className="hidden md:table-cell">Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Data Cad.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientsData.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-muted-foreground">{client.cpf}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col">
                      <span className="text-sm">{client.phone}</span>
                      <span className="text-xs text-muted-foreground">{client.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.status === 'Ativo' ? 'default' : 'secondary'} 
                           className={client.status === 'Ativo' ? 'bg-accent/10 text-accent hover:bg-accent/20 border-0' : ''}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{client.date}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <FileEdit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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