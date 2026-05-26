import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { ErrorMsg, Spinner } from "../components/common";
import {
  comodidadeService,
  imoveisService,
  reservaService,
  type ComodidadeCatalogo,
  type Imovel,
  type Reserva,
} from "../services/api";
import { geocodeFreeText, geocodePropertyAddress } from "../services/geocoding";

const _proto = L.Icon.Default.prototype as unknown as Record<string, unknown>;
delete _proto._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createPinIcon(available: boolean, selected: boolean) {
  const bg = selected ? "#f59e0b" : available ? "#10b981" : "#9ca3af";
  const size = selected ? 36 : 28;
  return new L.DivIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:${bg};border:2.5px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

function MapFlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  const prev = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (target && target !== prev.current) {
      prev.current = target;
      map.flyTo(target, 13, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
}

const toLocalDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const toIsoDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const ptBrCurrency = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function PropertyDetailPanel({
  imovel,
  onClose,
  onViewDetail,
  onBook,
}: {
  imovel: Imovel;
  onClose: () => void;
  onViewDetail?: (id: number) => void;
  onBook?: (id: number) => void;
}) {
  const addr = imovel.endereco;
  const fullAddr = addr
    ? `${addr.rua}, ${addr.numero} — ${addr.bairro}, ${addr.cidade}/${addr.estado}`
    : imovel.cidade;

  return (
    <div className="border-t border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold text-stone-800">
          {imovel.titulo}
        </h4>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors text-lg leading-none"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          {imovel.fotos?.[0] ? (
            <img
              src={imovel.fotos[0]}
              alt={imovel.titulo}
              className="w-full h-48 object-cover rounded-xl border border-stone-200"
            />
          ) : (
            <div className="w-full h-48 rounded-xl border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-stone-400 text-sm">
              Sem foto
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-3">
          <p className="text-sm text-stone-500 leading-relaxed">
            {imovel.descricao}
          </p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <p className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider">
                Diária
              </p>
              <p className="font-semibold text-stone-800">
                {ptBrCurrency(imovel.valorDiaria)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider">
                Cidade
              </p>
              <p className="text-stone-700">{imovel.cidade}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider">
                Endereço
              </p>
              <p className="text-stone-700">{fullAddr}</p>
            </div>
          </div>

          {(imovel.comodidades ?? []).length > 0 && (
            <div>
              <p className="text-[11px] text-stone-400 font-semibold uppercase tracking-wider mb-1.5">
                Comodidades
              </p>
              <div className="flex flex-wrap gap-1.5">
                {imovel.comodidades.map((c) => (
                  <span
                    key={c.nome}
                    className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium"
                  >
                    {c.nome}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {onBook && (
              <button
                onClick={() => onBook(imovel.idImovel)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
              >
                Realizar reserva
              </button>
            )}
            {onViewDetail && (
              <button
                onClick={() => onViewDetail(imovel.idImovel)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
              >
                Ver página completa →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RegionMap({
  imoveis,
  reservas,
  onViewDetail,
  onBook,
}: {
  imoveis: Imovel[];
  reservas: Reserva[];
  onViewDetail?: (id: number) => void;
  onBook?: (id: number) => void;
}) {
  const [dataInicio, setDataInicio] = useState(() => toIsoDate(new Date()));
  const [dataFim, setDataFim] = useState(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return toIsoDate(t);
  });
  const [addressInput, setAddressInput] = useState("");
  const [mapTarget, setMapTarget] = useState<[number, number] | null>(null);
  const [coords, setCoords] = useState<Record<number, [number, number]>>({});
  const geocodedIds = useRef(new Set<number>());
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  const handleStartChange = (v: string) => {
    setDataInicio(v);
    const s = toLocalDate(v);
    const e = toLocalDate(dataFim);
    if (s && e && e <= s) {
      const next = new Date(s);
      next.setDate(next.getDate() + 1);
      setDataFim(toIsoDate(next));
    }
  };

  const handleEndChange = (v: string) => {
    const s = toLocalDate(dataInicio);
    const e = toLocalDate(v);
    if (s && e && e <= s) return;
    setDataFim(v);
  };

  const inicioSelecionado = toLocalDate(dataInicio);
  const fimSelecionado = toLocalDate(dataFim);

  const reservasPorImovel = useMemo(() => {
    const map = new Map<number, Reserva[]>();
    reservas.forEach((r) => {
      const curr = map.get(r.idImovel) ?? [];
      curr.push(r);
      map.set(r.idImovel, curr);
    });
    return map;
  }, [reservas]);

  const isDisponivel = useCallback(
    (idImovel: number) => {
      if (!inicioSelecionado || !fimSelecionado) return true;
      const rs = reservasPorImovel.get(idImovel) ?? [];
      return !rs.some((r) => {
        const s = toLocalDate(r.dataInicio);
        const e = toLocalDate(r.dataFim);
        return s && e && inicioSelecionado < e && fimSelecionado > s;
      });
    },
    [inicioSelecionado, fimSelecionado, reservasPorImovel],
  );

  const disponiveisCount = useMemo(
    () => imoveis.filter((i) => isDisponivel(i.idImovel)).length,
    [imoveis, isDisponivel],
  );

  const mediaDiaria = useMemo(() => {
    const avail = imoveis.filter((i) => isDisponivel(i.idImovel));
    return avail.length > 0
      ? avail.reduce((a, i) => a + i.valorDiaria, 0) / avail.length
      : 0;
  }, [imoveis, isDisponivel]);

  useEffect(() => {
    const ungeocoded = imoveis.filter(
      (i) => !geocodedIds.current.has(i.idImovel),
    );
    if (ungeocoded.length === 0) return;

    let cancelled = false;
    const run = async () => {
      for (const item of ungeocoded) {
        if (cancelled) break;
        geocodedIds.current.add(item.idImovel);
        const result = await geocodePropertyAddress(item);
        if (result) {
          setCoords((prev) => ({ ...prev, [item.idImovel]: result }));
        }
        await new Promise((r) => setTimeout(r, 350));
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [imoveis]);

  const handleSearch = async () => {
    const q = addressInput.trim();
    if (!q) return;
    const result = await geocodeFreeText(q);
    if (result) setMapTarget(result);
  };

  const selectedProperty =
    imoveis.find((i) => i.idImovel === selectedPropertyId) ?? null;

  return (
    <section className="card-elevated overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--hostly-border)] space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--hostly-text)]">
            Mapa de imóveis
          </h3>
          <p className="text-xs text-[var(--hostly-muted)]">
            Pesquise um endereço para navegar; clique num pin para ver detalhes
            do imóvel. Verde = disponível, cinza = ocupado.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2">
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleSearch(); }}
            placeholder="Buscar endereço ou cidade…"
            className="h-11 bg-[var(--hostly-surface-soft)] border border-[var(--hostly-border)] rounded-xl px-3 py-2 text-sm text-[var(--hostly-text)] focus:outline-none focus:ring-2 focus:ring-[var(--hostly-focus)]"
          />
          <button
            onClick={() => void handleSearch()}
            className="h-11 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            Buscar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => handleStartChange(e.target.value)}
            className="h-11 bg-[var(--hostly-surface-soft)] border border-[var(--hostly-border)] rounded-xl px-3 py-2 text-sm text-[var(--hostly-text)]"
          />
          <input
            type="date"
            value={dataFim}
            min={dataInicio}
            onChange={(e) => handleEndChange(e.target.value)}
            className="h-11 bg-[var(--hostly-surface-soft)] border border-[var(--hostly-border)] rounded-xl px-3 py-2 text-sm text-[var(--hostly-text)]"
          />
          <div className="h-11 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-amber-700 font-semibold uppercase tracking-[0.12em]">
                Média diária (disponíveis)
              </p>
              <p className="text-sm font-bold text-amber-700 leading-none mt-0.5">
                {ptBrCurrency(mediaDiaria)}
              </p>
            </div>
            <span className="text-xs text-amber-600 font-medium bg-amber-100 px-2 py-0.5 rounded-full">
              {disponiveisCount} disponível{disponiveisCount !== 1 ? "is" : ""}
            </span>
          </div>
        </div>
      </div>

      <div style={{ height: 500 }}>
        <MapContainer
          center={[-15.793889, -47.882778]}
          zoom={4}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFlyTo target={mapTarget} />

          {imoveis.map((item) => {
            const pos = coords[item.idImovel];
            if (!pos) return null;
            const available = isDisponivel(item.idImovel);
            const selected = selectedPropertyId === item.idImovel;
            return (
              <Marker
                key={item.idImovel}
                position={pos}
                icon={createPinIcon(available, selected)}
                eventHandlers={{
                  click: () =>
                    setSelectedPropertyId(selected ? null : item.idImovel),
                }}
              />
            );
          })}
        </MapContainer>
      </div>

      {selectedProperty && (
        <PropertyDetailPanel
          imovel={selectedProperty}
          onClose={() => setSelectedPropertyId(null)}
          onViewDetail={onViewDetail}
          onBook={onBook}
        />
      )}
    </section>
  );
}

function FilterPanel({
  comodidades,
  selectedAmenities,
  onToggleAmenity,
  minRate,
  maxRate,
  onMinRate,
  onMaxRate,
  onApply,
  onClear,
  activeFiltersCount,
}: {
  comodidades: ComodidadeCatalogo[];
  selectedAmenities: number[];
  onToggleAmenity: (id: number) => void;
  minRate: string;
  maxRate: string;
  onMinRate: (v: string) => void;
  onMaxRate: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
  activeFiltersCount: number;
}) {
  return (
    <aside className="flex flex-col gap-4 w-64 shrink-0">
      <div className="card-elevated p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-800 tracking-tight">
            Filtros
          </h3>
          {activeFiltersCount > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-orange-500 hover:text-orange-700 font-semibold transition-colors"
            >
              Limpar ({activeFiltersCount})
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Diária (R$)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={minRate}
              onChange={(e) => onMinRate(e.target.value)}
              placeholder="Mín."
              className="h-9 w-full bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
            />
            <span className="text-stone-300 font-bold shrink-0">–</span>
            <input
              type="number"
              min={0}
              value={maxRate}
              onChange={(e) => onMaxRate(e.target.value)}
              placeholder="Máx."
              className="h-9 w-full bg-stone-50 border border-stone-200 rounded-xl px-3 text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
            />
          </div>
        </div>

        {comodidades.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Comodidades
            </label>
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-0.5">
              {comodidades.map((c) => {
                const active = selectedAmenities.includes(c.idComodidade);
                return (
                  <button
                    key={c.idComodidade}
                    onClick={() => onToggleAmenity(c.idComodidade)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-sm font-medium text-left transition-all ${
                      active
                        ? "bg-amber-50 border-amber-300 text-amber-800"
                        : "bg-white border-stone-200 text-stone-600 hover:border-amber-200 hover:bg-amber-50/40"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        active ? "bg-amber-500 border-amber-500" : "border-stone-300"
                      }`}
                    >
                      {active && (
                        <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2">
                          <path
                            d="M1 4l3 3 5-6"
                            stroke="white"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    {c.nome}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={onApply}
          className="h-10 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold shadow-sm shadow-orange-200/60 transition-all active:scale-[.98]"
        >
          Aplicar filtros
        </button>
      </div>

      <div className="card-elevated p-4 flex flex-col gap-2">
        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
          Legenda
        </p>
        {[
          { color: "#10b981", label: "Disponível no período" },
          { color: "#9ca3af", label: "Ocupado no período" },
          { color: "#f59e0b", label: "Selecionado" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: color }}
            />
            <span className="text-xs text-stone-500">{label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function DashboardPage({
  onViewDetail,
  onBook,
}: {
  onViewDetail?: (id: number) => void;
  onBook?: (id: number) => void;
} = {}) {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [comodidades, setComodidades] = useState<ComodidadeCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draftMinRate, setDraftMinRate] = useState("");
  const [draftMaxRate, setDraftMaxRate] = useState("");
  const [draftAmenities, setDraftAmenities] = useState<number[]>([]);

  const [appliedMinRate, setAppliedMinRate] = useState<number | undefined>();
  const [appliedMaxRate, setAppliedMaxRate] = useState<number | undefined>();
  const [appliedAmenities, setAppliedAmenities] = useState<number[]>([]);

  const activeFiltersCount = [
    draftMinRate !== "",
    draftMaxRate !== "",
    draftAmenities.length > 0,
  ].filter(Boolean).length;

  const loadImoveis = useCallback(
    async (params?: {
      valorDiariaMin?: number;
      valorDiariaMax?: number;
      comodidades?: number[];
    }) => {
      const data = await imoveisService.getAll({ ativo: true, ...params });
      return data.filter((item) => item.ativo);
    },
    [],
  );

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        const [imoveisData, reservasData, comodidadesData] = await Promise.all([
          loadImoveis(),
          reservaService.getAll(),
          comodidadeService.getAll(),
        ]);
        setImoveis(imoveisData);
        setReservas(reservasData);
        setComodidades(comodidadesData.filter((c) => c.ativo));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar dashboard");
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [loadImoveis]);

  const handleApplyFilters = async () => {
    setFiltering(true);
    setError(null);
    try {
      const params: Parameters<typeof loadImoveis>[0] = {};
      if (draftMinRate !== "") params.valorDiariaMin = Number(draftMinRate);
      if (draftMaxRate !== "") params.valorDiariaMax = Number(draftMaxRate);
      if (draftAmenities.length > 0) params.comodidades = draftAmenities;

      const data = await loadImoveis(params);
      setImoveis(data);
      setAppliedMinRate(draftMinRate !== "" ? Number(draftMinRate) : undefined);
      setAppliedMaxRate(draftMaxRate !== "" ? Number(draftMaxRate) : undefined);
      setAppliedAmenities(draftAmenities);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao filtrar");
    } finally {
      setFiltering(false);
    }
  };

  const handleClearFilters = async () => {
    setDraftMinRate("");
    setDraftMaxRate("");
    setDraftAmenities([]);
    setFiltering(true);
    try {
      const data = await loadImoveis();
      setImoveis(data);
      setAppliedMinRate(undefined);
      setAppliedMaxRate(undefined);
      setAppliedAmenities([]);
    } catch {
      // ignore
    } finally {
      setFiltering(false);
    }
  };

  const toggleAmenity = (id: number) => {
    setDraftAmenities((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const activeSummary: string[] = [];
  if (appliedMinRate !== undefined)
    activeSummary.push(`Min: ${ptBrCurrency(appliedMinRate)}`);
  if (appliedMaxRate !== undefined)
    activeSummary.push(`Máx: ${ptBrCurrency(appliedMaxRate)}`);
  if (appliedAmenities.length > 0) {
    const names = appliedAmenities
      .map((id) => comodidades.find((c) => c.idComodidade === id)?.nome ?? String(id))
      .join(", ");
    activeSummary.push(`Comodidades: ${names}`);
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg msg={error} />;

  return (
    <div className="space-y-4">
      <div className="card-elevated p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-[var(--hostly-text)] tracking-tight">
              Visão por região e disponibilidade
            </h1>
            <p className="text-sm text-[var(--hostly-muted)] mt-1">
              Pesquise um endereço para navegar no mapa. Os imóveis aparecem como
              pins — clique para ver detalhes e disponibilidade.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-stone-100 text-xs font-semibold text-stone-500">
              {imoveis.length} imóvel{imoveis.length !== 1 ? "eis" : ""}
            </span>
            {filtering && (
              <span className="flex items-center gap-1.5 text-xs text-orange-500 font-medium">
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Filtrando…
              </span>
            )}
          </div>
        </div>

        {activeSummary.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-stone-100">
            <span className="text-xs text-stone-400 font-semibold">Ativos:</span>
            {activeSummary.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs text-orange-700 font-semibold"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4 items-start">
        <FilterPanel
          comodidades={comodidades}
          selectedAmenities={draftAmenities}
          onToggleAmenity={toggleAmenity}
          minRate={draftMinRate}
          maxRate={draftMaxRate}
          onMinRate={setDraftMinRate}
          onMaxRate={setDraftMaxRate}
          onApply={() => void handleApplyFilters()}
          onClear={() => void handleClearFilters()}
          activeFiltersCount={activeFiltersCount}
        />

        <div className="flex-1 min-w-0">
          <RegionMap
            imoveis={imoveis}
            reservas={reservas}
            onViewDetail={onViewDetail}
            onBook={onBook}
          />
        </div>
      </div>
    </div>
  );
}
