import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Filter,
  Maximize2,
  MapPin,
  Droplets,
  Zap,
  Wifi,
  Plus,
  Edit2,
  MousePointerClick,
  Trash2,
  Image as ImageIcon,
  LocateFixed,
  AlertCircle,
  CalendarCheck2,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { SafeUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type DevelopmentItem = {
  id: string;
  name: string;
  city: string;
  type: string;
  price: string;
  status: string;
  totalLots: number;
  plantPdfUrl?: string | null;
  plantImageUrl?: string | null;
  overviewImageUrl?: string | null;
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
  createdAt?: string;
  updatedAt?: string;
};

type MapPoint = {
  xPercent: number;
  yPercent: number;
};

type MapPointsByLotId = Record<string, MapPoint>;

const getMarkerColor = (status: string) => {
  switch (status) {
    case "Disponível":
      return "bg-emerald-500 border-emerald-700";
    case "Reservado":
      return "bg-amber-400 border-amber-600";
    case "Vendido":
      return "bg-slate-400 border-slate-600";
    default:
      return "bg-slate-300 border-slate-500";
  }
};

function getStorageKey(developmentId: string) {
  return `smartlote-map-points:${developmentId}`;
}

function loadMapPoints(developmentId: string): MapPointsByLotId {
  try {
    const raw = window.localStorage.getItem(getStorageKey(developmentId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveMapPoints(developmentId: string, points: MapPointsByLotId) {
  try {
    window.localStorage.setItem(getStorageKey(developmentId), JSON.stringify(points));
  } catch {
    //
  }
}

export default function Lots() {
  const [zoom, setZoom] = useState(1);
  const [selectedDevelopmentId, setSelectedDevelopmentId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedLot, setSelectedLot] = useState<LotItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [mappingLotId, setMappingLotId] = useState<string | null>(null);
  const [mapPoints, setMapPoints] = useState<MapPointsByLotId>({});

  const imageStageRef = useRef<HTMLDivElement | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: currentUser } = useQuery<SafeUser | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const canManageLots =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  const canReserveLots =
    currentUser?.role === "admin" ||
    currentUser?.role === "manager" ||
    currentUser?.role === "broker";

  const { data: developments = [] } = useQuery<DevelopmentItem[]>({
    queryKey: ["/api/admin/developments"],
    retry: false,
  });

  useEffect(() => {
    if (!selectedDevelopmentId && developments.length > 0) {
      setSelectedDevelopmentId(developments[0].id);
    }
  }, [developments, selectedDevelopmentId]);

  useEffect(() => {
    if (!selectedDevelopmentId) return;
    setMapPoints(loadMapPoints(selectedDevelopmentId));
    setSelectedLot(null);
    setMappingLotId(null);
  }, [selectedDevelopmentId]);

  const lotsQueryKey = selectedDevelopmentId
    ? `/api/admin/lots?developmentId=${selectedDevelopmentId}`
    : "/api/admin/lots";

  const { data: lotsData = [] } = useQuery<LotItem[]>({
    queryKey: [lotsQueryKey],
    retry: false,
    enabled: Boolean(selectedDevelopmentId),
  });

  const selectedDevelopment = useMemo(
    () =>
      developments.find((item) => item.id === selectedDevelopmentId) ?? null,
    [developments, selectedDevelopmentId],
  );

  const filteredLots = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return lotsData;

    return lotsData.filter((lot) => {
      const text = [
        lot.code,
        lot.block,
        lot.lot,
        lot.developmentName,
        `Q.${lot.block} L.${lot.lot}`,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [lotsData, search]);

  const counts = useMemo(() => {
    return {
      disponivel: lotsData.filter((lot) => lot.status === "Disponível").length,
      reservado: lotsData.filter((lot) => lot.status === "Reservado").length,
      vendido: lotsData.filter((lot) => lot.status === "Vendido").length,
      mapeados: Object.keys(mapPoints).length,
    };
  }, [lotsData, mapPoints]);

  const mappedLots = useMemo(() => {
    return lotsData.filter((lot) => mapPoints[lot.id]);
  }, [lotsData, mapPoints]);

  const updateLotMutation = useMutation({
    mutationFn: async (payload: LotItem) => {
      await apiRequest("PUT", `/api/admin/lots/${payload.id}`, {
        developmentId: payload.developmentId,
        code: payload.code,
        block: payload.block,
        lot: payload.lot,
        areaM2: payload.areaM2,
        frontM: payload.frontM,
        price: payload.price,
        status: payload.status,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].startsWith("/api/admin/lots"),
      });

      toast({
        title: "Lote atualizado",
        description: "As informações do lote foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Falha ao atualizar lote",
        description: "Não foi possível salvar as alterações do lote.",
        variant: "destructive",
      });
    },
  });

  const reserveLotMutation = useMutation({
    mutationFn: async (payload: LotItem) => {
      await apiRequest("PUT", `/api/admin/lots/${payload.id}`, {
        developmentId: payload.developmentId,
        code: payload.code,
        block: payload.block,
        lot: payload.lot,
        areaM2: payload.areaM2,
        frontM: payload.frontM,
        price: payload.price,
        status: "Reservado",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].startsWith("/api/admin/lots"),
      });

      toast({
        title: "Lote reservado",
        description: "A reserva foi registrada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Falha ao reservar lote",
        description: "Não foi possível reservar este lote agora.",
        variant: "destructive",
      });
    },
  });

  const handleMapChange = (val: string) => {
    setSelectedDevelopmentId(val);
    setSearch("");
    setZoom(1);
    toast({
      title: "Mapa alterado",
      description: "Empreendimento selecionado com sucesso.",
    });
  };

  const openEditLot = (lot: LotItem) => {
    if (!canManageLots) return;
    setSelectedLot({ ...lot });
    setIsEditDialogOpen(true);
  };

  const handleSaveLot = () => {
    if (!selectedLot || !canManageLots) return;
    updateLotMutation.mutate(selectedLot);
    setIsEditDialogOpen(false);
  };

  const handleReserveLot = (lot: LotItem) => {
    if (!canReserveLots) return;
    reserveLotMutation.mutate(lot);
    setSelectedLot(lot);
  };

  function startMappingLot(lot: LotItem) {
    if (!canManageLots) return;

    setSelectedLot(lot);
    setMappingLotId(lot.id);
    toast({
      title: "Modo de marcação ativado",
      description: `Agora clique na planta na posição do lote Q.${lot.block} L.${lot.lot}.`,
    });
  }

  function removeMapPointForLot(lotId: string) {
    if (!selectedDevelopmentId || !canManageLots) return;

    const next = { ...mapPoints };
    delete next[lotId];
    setMapPoints(next);
    saveMapPoints(selectedDevelopmentId, next);

    toast({
      title: "Ponto removido",
      description: "O lote deixou de ficar clicável na planta até ser remarcado.",
    });
  }

  function handleOverlayClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!mappingLotId || !selectedDevelopmentId || !imageStageRef.current || !canManageLots) {
      return;
    }

    const rect = imageStageRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const next: MapPointsByLotId = {
      ...mapPoints,
      [mappingLotId]: {
        xPercent: Math.max(0, Math.min(100, Number(x.toFixed(2)))),
        yPercent: Math.max(0, Math.min(100, Number(y.toFixed(2)))),
      },
    };

    setMapPoints(next);
    saveMapPoints(selectedDevelopmentId, next);

    const lot = lotsData.find((item) => item.id === mappingLotId) ?? null;
    if (lot) setSelectedLot(lot);

    setMappingLotId(null);

    toast({
      title: "Lote marcado na planta",
      description: lot
        ? `O lote Q.${lot.block} L.${lot.lot} agora já pode ser clicado diretamente na imagem.`
        : "Ponto salvo no mapa.",
    });
  }

  const selectedLotMapped = selectedLot ? Boolean(mapPoints[selectedLot.id]) : false;

  return (
    <div className="space-y-5 sm:space-y-6 flex flex-col min-h-0 lg:h-[calc(100vh-8rem)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between shrink-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Mapa Digital de Loteamentos
          </h1>
          <p className="text-sm sm:text-base text-slate-500">
            {canManageLots
              ? "Gestor e administrador podem editar lotes e marcar a planta."
              : "Corretor pode consultar a planta e reservar lotes disponíveis."}
          </p>
        </div>

        <div className="w-full xl:w-auto">
          <Select value={selectedDevelopmentId} onValueChange={handleMapChange}>
            <SelectTrigger className="w-full xl:w-[320px] bg-white border-slate-300 font-medium">
              <SelectValue placeholder="Selecione o Empreendimento" />
            </SelectTrigger>
            <SelectContent>
              {developments.map((development) => (
                <SelectItem key={development.id} value={development.id}>
                  {development.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="flex-1 min-h-0 shadow-md border-slate-200 bg-slate-50 overflow-hidden flex flex-col">
        <div className="p-3 bg-white border-b border-slate-200 flex flex-col gap-3 xl:flex-row xl:justify-between xl:items-center z-10 shrink-0 shadow-sm">
          <div className="flex gap-2 sm:gap-3 items-center flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md">
              <div className="w-3 h-3 rounded-sm bg-emerald-500 shadow-sm"></div>
              <span className="text-xs sm:text-sm font-semibold text-slate-700">
                Disponível ({counts.disponivel})
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md">
              <div className="w-3 h-3 rounded-sm bg-amber-400 shadow-sm"></div>
              <span className="text-xs sm:text-sm font-semibold text-slate-700">
                Reservado ({counts.reservado})
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md">
              <div className="w-3 h-3 rounded-sm bg-slate-300 shadow-sm"></div>
              <span className="text-xs sm:text-sm font-semibold text-slate-700">
                Vendido ({counts.vendido})
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md">
              <div className="w-3 h-3 rounded-sm bg-sky-500 shadow-sm"></div>
              <span className="text-xs sm:text-sm font-semibold text-slate-700">
                Mapeados ({counts.mapeados})
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar lote (ex: A-01)"
                className="pl-9 h-9 w-full bg-white border-slate-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button variant="outline" size="sm" className="h-9 gap-2 text-slate-600 w-full sm:w-auto">
              <Filter className="w-4 h-4" /> Filtros
            </Button>
          </div>
        </div>

        <CardContent className="p-3 sm:p-4 flex-1 min-h-0 overflow-hidden">
          <div className="grid grid-cols-1 2xl:grid-cols-[1.4fr_420px] gap-4 h-full min-h-0">
            <div className="relative rounded-2xl border border-slate-200 bg-white overflow-hidden min-h-[360px] lg:min-h-[600px]">
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex flex-wrap gap-2 max-w-[calc(100%-110px)]">
                {selectedDevelopment?.plantPdfUrl ? (
                  <a
                    href={selectedDevelopment.plantPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="outline" size="sm" className="bg-white/95 gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Abrir PDF da planta
                    </Button>
                  </a>
                ) : null}

                {mappingLotId && canManageLots ? (
                  <Badge className="bg-amber-500 text-white px-3 py-2 text-xs">
                    <MousePointerClick className="h-3.5 w-3.5 mr-1" />
                    Clique na imagem para marcar o lote selecionado
                  </Badge>
                ) : null}
              </div>

              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col gap-2 z-30 bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg border border-slate-200">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
                  className="h-8 w-8 hover:bg-slate-200"
                >
                  <Plus className="w-4 h-4" />
                </Button>

                <div className="h-px w-full bg-slate-200"></div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
                  className="h-8 w-8 hover:bg-slate-200"
                >
                  <div className="w-4 h-0.5 bg-slate-700"></div>
                </Button>

                <div className="h-px w-full bg-slate-200"></div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoom(1)}
                  className="h-8 w-8 hover:bg-slate-200"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-auto z-30 bg-white/95 border border-slate-200 rounded-xl p-3 shadow-sm max-w-md">
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <LocateFixed className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">
                      Como usar a planta real
                    </p>
                    <p>
                      {canManageLots
                        ? "Se um lote ainda não estiver clicável, selecione-o na lista ao lado e clique em Marcar no mapa. Depois clique na posição dele na imagem."
                        : "Como corretor, você pode consultar a planta, selecionar lotes e reservar os disponíveis."}
                    </p>
                  </div>
                </div>
              </div>

              {selectedDevelopment?.plantImageUrl ? (
                <div className="h-full w-full overflow-auto bg-slate-100">
                  <div className="min-w-full min-h-full flex items-start justify-center p-3 sm:p-6">
                    <div className="origin-top" style={{ transform: `scale(${zoom})` }}>
                      <div ref={imageStageRef} className="relative inline-block">
                        <img
                          src={selectedDevelopment.plantImageUrl}
                          alt={`Planta de ${selectedDevelopment.name}`}
                          className="block max-w-none rounded-xl shadow-lg border border-slate-300 select-none"
                          draggable={false}
                        />

                        <div
                          className={`absolute inset-0 z-10 ${
                            mappingLotId && canManageLots ? "cursor-crosshair" : "cursor-default"
                          }`}
                          onClick={handleOverlayClick}
                        />

                        {mappedLots.map((lot) => {
                          const point = mapPoints[lot.id];
                          if (!point) return null;

                          const isSelected = selectedLot?.id === lot.id;

                          return (
                            <Tooltip key={lot.id} delayDuration={80}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 text-white shadow-lg transition-all z-20 ${
                                    getMarkerColor(lot.status)
                                  } ${isSelected ? "h-9 w-9 ring-4 ring-sky-300" : "h-7 w-7"}`}
                                  style={{
                                    left: `${point.xPercent}%`,
                                    top: `${point.yPercent}%`,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedLot(lot);
                                  }}
                                  title={`Q.${lot.block} L.${lot.lot}`}
                                >
                                  <span className="text-[10px] font-black">{lot.lot}</span>
                                </button>
                              </TooltipTrigger>

                              <TooltipContent side="top">
                                <div className="text-xs">
                                  <div className="font-bold">
                                    Q.{lot.block} L.{lot.lot}
                                  </div>
                                  <div>{lot.status}</div>
                                  <div>R$ {lot.price}</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-8">
                  <div className="max-w-xl text-center space-y-3">
                    <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-900">
                      Este empreendimento ainda não tem planta em imagem
                    </h3>
                    <p className="text-sm text-slate-500">
                      Vá em <strong>Configurações → Empreendimentos</strong> e preencha o campo
                      <strong> Planta em imagem (JPG/PNG)</strong> para usar o mapa real clicável.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col min-h-[420px] lg:min-h-[600px] min-w-0">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900">Lotes do empreendimento</h3>
                <p className="text-sm text-slate-500">
                  {canManageLots
                    ? "Gestor/Admin podem editar, remarcar e reservar."
                    : "Corretor consulta e reserva lotes disponíveis."}
                </p>
              </div>

              <div className="flex-1 overflow-auto min-h-0">
                <div className="divide-y divide-slate-100">
                  {filteredLots.map((lot) => {
                    const isSelected = selectedLot?.id === lot.id;
                    const isMapped = Boolean(mapPoints[lot.id]);

                    return (
                      <button
                        key={lot.id}
                        type="button"
                        onClick={() => setSelectedLot(lot)}
                        className={`w-full text-left p-4 transition-colors ${
                          isSelected ? "bg-sky-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-black text-slate-900">
                                  Q.{lot.block} L.{lot.lot}
                                </p>
                                <Badge
                                  className={
                                    lot.status === "Disponível"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : lot.status === "Reservado"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-slate-200 text-slate-700"
                                  }
                                >
                                  {lot.status}
                                </Badge>
                                {isMapped ? (
                                  <Badge className="bg-sky-100 text-sky-700">
                                    Mapeado
                                  </Badge>
                                ) : null}
                              </div>

                              <p className="text-xs text-slate-500 mt-1 break-words">
                                {lot.code} • {lot.areaM2} m² • Frente {lot.frontM} m
                              </p>
                              <p className="text-sm font-bold text-emerald-700 mt-1">
                                R$ {lot.price}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                            {canManageLots ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="gap-2 w-full sm:w-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startMappingLot(lot);
                                  }}
                                >
                                  <MapPin className="h-3.5 w-3.5" />
                                  {isMapped ? "Remarcar" : "Marcar no mapa"}
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="gap-2 w-full sm:w-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditLot(lot);
                                  }}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                  Editar
                                </Button>
                              </>
                            ) : null}

                            {canReserveLots && lot.status === "Disponível" ? (
                              <Button
                                type="button"
                                size="sm"
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReserveLot(lot);
                                }}
                              >
                                <CalendarCheck2 className="h-3.5 w-3.5" />
                                Reservar
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {filteredLots.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      Nenhum lote encontrado.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-slate-200 p-4 bg-slate-50 shrink-0">
                {selectedLot ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-lg font-black text-slate-900">
                          Q.{selectedLot.block} L.{selectedLot.lot}
                        </h4>
                        <Badge
                          className={
                            selectedLot.status === "Disponível"
                              ? "bg-emerald-100 text-emerald-700"
                              : selectedLot.status === "Reservado"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-200 text-slate-700"
                          }
                        >
                          {selectedLot.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-500 break-words">
                        {selectedLot.code} • {selectedLot.areaM2} m² • Frente {selectedLot.frontM} m
                      </p>
                      <p className="text-base font-black text-emerald-700 mt-1">
                        R$ {selectedLot.price}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {canManageLots ? (
                        <>
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => startMappingLot(selectedLot)}
                          >
                            <MousePointerClick className="h-4 w-4" />
                            {selectedLotMapped ? "Remarcar ponto" : "Marcar ponto"}
                          </Button>

                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => openEditLot(selectedLot)}
                          >
                            <Edit2 className="h-4 w-4" />
                            Editar lote
                          </Button>
                        </>
                      ) : null}

                      {canReserveLots && selectedLot.status === "Disponível" ? (
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleReserveLot(selectedLot)}
                        >
                          Reservar
                        </Button>
                      ) : null}

                      {canManageLots ? (
                        <Button
                          variant="outline"
                          className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                          disabled={!selectedLotMapped}
                          onClick={() => removeMapPointForLot(selectedLot.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remover ponto
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">
                    Selecione um lote na lista ou clique em um marcador na planta.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3 z-20 bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm border border-slate-200">
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Infraestrutura do Empreendimento
              </p>
              <div className="flex gap-4 mt-1 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                  <Droplets className="w-4 h-4 text-blue-500" /> Água
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                  <Zap className="w-4 h-4 text-amber-500" /> Energia
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-500" /> Asfalto
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                  <Wifi className="w-4 h-4 text-emerald-500" /> Fibra Óptica
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar Lote {selectedLot?.block}-{selectedLot?.lot}
            </DialogTitle>
            <DialogDescription>
              Ajuste as características e disponibilidade deste lote.
            </DialogDescription>
          </DialogHeader>

          {selectedLot && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedLot.status}
                  onValueChange={(value) =>
                    setSelectedLot({
                      ...selectedLot,
                      status: value as LotItem["status"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Reservado">Reservado</SelectItem>
                    <SelectItem value="Vendido">Vendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Área (m²)</Label>
                  <Input
                    type="number"
                    value={selectedLot.areaM2}
                    onChange={(e) =>
                      setSelectedLot({
                        ...selectedLot,
                        areaM2: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Frente (m)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={selectedLot.frontM}
                    onChange={(e) =>
                      setSelectedLot({
                        ...selectedLot,
                        frontM: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Valor Base (R$)</Label>
                <Input
                  value={selectedLot.price}
                  onChange={(e) =>
                    setSelectedLot({
                      ...selectedLot,
                      price: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSaveLot}
              disabled={updateLotMutation.isPending}
            >
              Salvar Lote
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}