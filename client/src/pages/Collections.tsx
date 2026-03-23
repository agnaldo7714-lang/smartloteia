import { useMemo, useState } from "react";
import {
  AlertCircle,
  Search,
  Filter,
  MessageCircle,
  FileText,
  Send,
  Lock,
  LoaderCircle,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type CollectionItem = {
  id: string;
  client: string;
  project: string;
  delay: number;
  value: string;
  status: string;
  risk: string;
  lastContact: string;
};

export default function Collections() {
  const [search, setSearch] = useState("");
  const [loading] = useState(false);

  /**
   * Tela limpa: sem mock, sem fallback e sem edição local.
   * Quando o módulo real de cobrança existir no PostgreSQL,
   * substitua por useQuery da rota correspondente.
   */
  const collections: CollectionItem[] = [];

  const filteredData = useMemo(() => {
    return collections.filter((item) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;

      const text = [
        item.client,
        item.project,
        item.status,
        item.risk,
        item.value,
        item.lastContact,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [collections, search]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6 sm:p-10 flex items-center justify-center text-slate-500">
            <span className="inline-flex items-center gap-2 text-sm sm:text-base">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Carregando módulo de cobrança...
            </span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex flex-wrap items-center gap-3">
            CRM de Cobrança
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-700 border-0 uppercase tracking-widest text-[10px]"
            >
              Sem mock
            </Badge>
          </h1>
          <p className="text-sm sm:text-base text-slate-500">
            Gestão de inadimplência, réguas de cobrança e acordos somente com dados persistidos no banco.
          </p>
        </div>

        <div className="flex w-full xl:w-auto flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-white text-slate-700 border-slate-300 w-full sm:w-auto"
            disabled
          >
            <FileText className="h-4 w-4" />
            Gerar Acordos
          </Button>

          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md w-full sm:w-auto"
            disabled
          >
            <Send className="h-4 w-4" />
            Disparo Lote
          </Button>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 sm:p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-700" />
          </div>

          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Módulo de cobrança ainda não conectado ao PostgreSQL
              </h2>
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                Sem dados fictícios
              </Badge>
            </div>

            <p className="text-sm sm:text-base text-slate-700">
              Todos os acordos simulados, réguas de cobrança fictícias, números de
              inadimplência inventados, disparos falsos e edições locais foram removidos
              desta tela. Quando o módulo real de cobrança for persistido no banco,
              os registros aparecerão aqui.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">
              Inadimplência Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800">Sem dados</div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Nenhum cálculo real carregado do banco
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Atraso Crítico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-red-700">Sem dados</div>
            <p className="text-xs font-semibold text-red-600/80 mt-1">
              Nenhum contrato crítico persistido no banco
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-emerald-700">
              Recuperado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-700">Sem dados</div>
            <p className="text-xs font-semibold text-emerald-600/80 mt-1">
              Nenhum acordo real recuperado no banco
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-blue-700">
              Ações Automáticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-800">Sem dados</div>
            <p className="text-xs font-semibold text-blue-600/80 mt-1">
              Nenhuma automação real conectada
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200 bg-white">
        <CardHeader className="p-4 border-b border-slate-100 pb-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:justify-between xl:items-center">
            <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por cliente, contrato ou lote..."
                  className="pl-9 bg-slate-50 border-slate-200 font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                className="border-slate-200 text-slate-600 shrink-0"
                disabled
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 font-bold px-3 py-1">
                Todos (0)
              </Badge>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 font-bold px-3 py-1 border-0">
                Risco Alto (0)
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredData.length === 0 ? (
            <div className="p-6 sm:p-10 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Receipt className="h-7 w-7 text-slate-500" />
              </div>

              <h3 className="text-lg font-black text-slate-900">
                Nenhum acordo ou cobrança cadastrado
              </h3>

              <p className="text-slate-500 mt-2 max-w-2xl mx-auto text-sm sm:text-base">
                Esta tela foi limpa para não exibir clientes em atraso fictícios,
                status de régua inventados, acordos locais ou automações falsas.
                Quando o módulo real de cobrança for persistido no PostgreSQL,
                os registros aparecerão aqui.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
                <Button variant="outline" disabled className="gap-2 w-full sm:w-auto">
                  <Lock className="h-4 w-4" />
                  Sem edição local
                </Button>
                <Button disabled className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp desabilitado
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="block lg:hidden space-y-4 p-4">
                {filteredData.map((item) => (
                  <Card key={item.id} className="border shadow-none">
                    <CardContent className="p-4 space-y-3">
                      <div className="font-semibold text-slate-900 break-words">
                        {item.client}
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="rounded-lg bg-slate-50 p-3">
                          <div className="text-xs text-slate-500 mb-1">Empreendimento</div>
                          <div className="font-medium break-words">{item.project}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-slate-50 p-3">
                            <div className="text-xs text-slate-500 mb-1">Atraso</div>
                            <div className="font-medium">{item.delay}</div>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-3">
                            <div className="text-xs text-slate-500 mb-1">Valor</div>
                            <div className="font-medium break-words">{item.value}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="rounded-lg bg-slate-50 p-3">
                            <div className="text-xs text-slate-500 mb-1">Status</div>
                            <div className="font-medium break-words">{item.status}</div>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-3">
                            <div className="text-xs text-slate-500 mb-1">Último contato</div>
                            <div className="font-medium break-words">{item.lastContact}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.client}</TableCell>
                        <TableCell>{item.project}</TableCell>
                        <TableCell>{item.delay}</TableCell>
                        <TableCell>{item.value}</TableCell>
                        <TableCell>{item.status}</TableCell>
                        <TableCell>{item.lastContact}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}