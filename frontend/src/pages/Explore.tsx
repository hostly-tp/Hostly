import { useEffect, useState, useCallback } from "react";
import { Search, SlidersHorizontal, X, MapPin, ChevronRight } from "lucide-react";
import { imoveisService, comodidadeService, type Imovel, type ComodidadeCatalogo } from "../services/api";
import { MapView, useGeoProperties, type GeoProperty } from "../features/map/MapView";
import { useStore } from "../app/store";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export default function Explore() {
  const { filters, setFilters, openDetail, setSelectedProperty } = useStore();
  const [allProperties, setAllProperties] = useState<Imovel[]>([]);
  const [filtered, setFiltered] = useState<Imovel[]>([]);
  const [amenities, setAmenities] = useState<ComodidadeCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGeo, setSelectedGeo] = useState<GeoProperty | null>(null);
  const { geo, loading: geoLoading } = useGeoProperties(allProperties);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const data = await imoveisService.getAll({ ativo: true });
      setAllProperties(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
    comodidadeService.getAll().then(setAmenities).catch(() => {});
  }, []);

  /* filter logic */
  useEffect(() => {
    let list = allProperties;
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.titulo.toLowerCase().includes(q) ||
          p.cidade.toLowerCase().includes(q) ||
          p.descricao?.toLowerCase().includes(q),
      );
    }
    if (filters.priceMin > 0) list = list.filter((p) => p.valorDiaria >= filters.priceMin);
    if (filters.priceMax < 5000) list = list.filter((p) => p.valorDiaria <= filters.priceMax);
    if (filters.amenityIds.length > 0) {
      list = list.filter((p) =>
        filters.amenityIds.every((aid) =>
          p.comodidades.some((c) => c.idComodidade === aid),
        ),
      );
    }
    setFiltered(list);
  }, [allProperties, filters]);

  const handleSelect = (p: GeoProperty | null) => {
    setSelectedGeo(p);
    setSelectedProperty(p?.idImovel ?? null);
  };

  const geoFiltered = geo.filter((g) => filtered.some((f) => f.idImovel === g.idImovel));

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Left panel */}
      <div
        style={{
          width: 340,
          minWidth: 340,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        {/* Search bar */}
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-4)",
                pointerEvents: "none",
              }}
            />
            <input
              className="field-input"
              style={{ paddingLeft: 36, paddingRight: 36 }}
              placeholder="Buscar cidade, bairro, imóvel..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
            {filters.search && (
              <button
                onClick={() => setFilters({ search: "" })}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--ink-4)",
                  display: "flex",
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1.5px solid var(--border)",
              background: showFilters ? "var(--accent-tint)" : "var(--surface)",
              color: showFilters ? "var(--accent)" : "var(--ink-3)",
              fontSize: 12,
              fontWeight: 600,
              transition: "all 140ms ease",
            }}
          >
            <SlidersHorizontal size={13} />
            Filtros
            {(filters.amenityIds.length > 0 || filters.priceMin > 0 || filters.priceMax < 5000) && (
              <span
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                  borderRadius: "99px",
                  fontSize: 10,
                  padding: "1px 6px",
                  fontWeight: 700,
                }}
              >
                {filters.amenityIds.length + (filters.priceMin > 0 || filters.priceMax < 5000 ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
              background: "var(--canvas)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Preço/noite
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="field-input"
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={filters.priceMin || ""}
                  onChange={(e) => setFilters({ priceMin: Number(e.target.value) || 0 })}
                  style={{ textAlign: "center" }}
                />
                <span style={{ display: "flex", alignItems: "center", color: "var(--ink-4)", fontSize: 13 }}>–</span>
                <input
                  className="field-input"
                  type="number"
                  min={0}
                  placeholder="Máx"
                  value={filters.priceMax < 5000 ? filters.priceMax : ""}
                  onChange={(e) => setFilters({ priceMax: Number(e.target.value) || 5000 })}
                  style={{ textAlign: "center" }}
                />
              </div>
            </div>

            {amenities.length > 0 && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                  Comodidades
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {amenities.filter((a) => a.ativo).slice(0, 12).map((a) => {
                    const active = filters.amenityIds.includes(a.idComodidade);
                    return (
                      <button
                        key={a.idComodidade}
                        onClick={() =>
                          setFilters({
                            amenityIds: active
                              ? filters.amenityIds.filter((id) => id !== a.idComodidade)
                              : [...filters.amenityIds, a.idComodidade],
                          })
                        }
                        style={{
                          padding: "5px 10px",
                          borderRadius: "99px",
                          border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                          background: active ? "var(--accent-tint)" : "var(--surface)",
                          color: active ? "var(--accent)" : "var(--ink-3)",
                          fontSize: 11,
                          fontWeight: 600,
                          transition: "all 120ms ease",
                        }}
                      >
                        {a.nome}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setFilters({ priceMin: 0, priceMax: 5000, amenityIds: [], search: "" });
              }}
              style={{
                alignSelf: "flex-start",
                fontSize: 12,
                color: "var(--red)",
                background: "none",
                border: "none",
                padding: 0,
                fontWeight: 600,
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}

        {/* Results count */}
        <div
          style={{
            padding: "10px 16px",
            fontSize: 12,
            color: "var(--ink-3)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {loading ? "Carregando..." : `${filtered.length} imóvel(is) encontrado(s)`}
          {geoLoading && " · Localizando no mapa..."}
        </div>

        {/* Property list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map((p) => (
            <PropertyListItem
              key={p.idImovel}
              property={p}
              selected={selectedGeo?.idImovel === p.idImovel}
              onSelect={() => openDetail(p.idImovel)}
            />
          ))}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: "var(--ink-4)", fontSize: 13 }}>
              Nenhum imóvel encontrado.
              <br />
              <button
                onClick={() => setFilters({ priceMin: 0, priceMax: 5000, amenityIds: [], search: "" })}
                style={{ color: "var(--accent)", background: "none", border: "none", fontWeight: 600, marginTop: 8, fontSize: 13 }}
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <MapView
          properties={geoFiltered}
          loading={geoLoading}
          onSelect={handleSelect}
          selectedId={selectedGeo?.idImovel}
        />

        {/* Selected preview card */}
        {selectedGeo && (
          <PropertyPreviewCard
            property={selectedGeo}
            onView={() => openDetail(selectedGeo.idImovel)}
            onClose={() => setSelectedGeo(null)}
          />
        )}
      </div>
    </div>
  );
}

function PropertyListItem({
  property: p,
  selected,
  onSelect,
}: {
  property: Imovel;
  selected: boolean;
  onSelect: () => void;
}) {
  const photo = p.fotos?.[0];
  return (
    <div
      onClick={onSelect}
      style={{
        display: "flex",
        gap: 12,
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
        background: selected ? "var(--accent-tint)" : "transparent",
        transition: "background 120ms ease",
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = "var(--canvas)";
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          flexShrink: 0,
          background: "var(--surface-dim)",
        }}
      >
        {photo ? (
          <img src={photo} alt={p.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MapPin size={20} style={{ color: "var(--ink-5)" }} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink)",
            marginBottom: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {p.titulo}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6 }}>
          {p.cidade} · {p.endereco.estado}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
          {fmt(p.valorDiaria)}
          <span style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-3)" }}>/noite</span>
        </div>
      </div>
      <ChevronRight size={16} style={{ color: "var(--ink-5)", flexShrink: 0, alignSelf: "center" }} />
    </div>
  );
}

function PropertyPreviewCard({
  property: p,
  onView,
  onClose,
}: {
  property: GeoProperty;
  onView: () => void;
  onClose: () => void;
}) {
  const photo = p.fotos?.[0];
  return (
    <div
      className="anim-fade-up"
      style={{
        position: "absolute",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        background: "var(--surface)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-xl)",
        overflow: "hidden",
        width: 320,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {photo && (
        <div style={{ height: 140, overflow: "hidden" }}>
          <img src={photo} alt={p.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 4, lineHeight: 1.3 }}>
          {p.titulo}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={12} />
          {p.cidade} · {p.endereco.estado}
        </div>
        {p.comodidades.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
            {p.comodidades.slice(0, 3).map((c, i) => (
              <span
                key={i}
                style={{
                  padding: "3px 8px",
                  borderRadius: "99px",
                  background: "var(--canvas)",
                  border: "1px solid var(--border)",
                  fontSize: 11,
                  color: "var(--ink-3)",
                }}
              >
                {c.nome}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--accent)" }}>
            {fmt(p.valorDiaria)}
            <span style={{ fontSize: 12, fontWeight: 400, color: "var(--ink-3)" }}>/noite</span>
          </div>
          <button onClick={onView} className="btn btn-primary btn-sm">
            Ver imóvel →
          </button>
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.9)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <X size={14} style={{ color: "var(--ink)" }} />
      </button>
    </div>
  );
}
