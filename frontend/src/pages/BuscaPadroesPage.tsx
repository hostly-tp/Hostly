import { useState } from "react";
import { Search } from "lucide-react";
import {
  buscaPadroesService,
  type BuscaPadroesResult,
} from "../services/api";

type Entidade = "imoveis" | "usuarios" | "reservas";

const ENTIDADES: { value: Entidade; label: string }[] = [
  { value: "imoveis", label: "Imóveis" },
  { value: "usuarios", label: "Usuários" },
  { value: "reservas", label: "Reservas" },
];

export default function BuscaPadroesPage() {
  const [query, setQuery] = useState("");
  const [entidade, setEntidade] = useState<Entidade>("imoveis");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BuscaPadroesResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await buscaPadroesService.search(query.trim(), entidade);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao buscar");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void handleSearch();
  };

  return (
    <div style={{ padding: "28px 36px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-md)",
            background: "var(--accent-tint)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Search size={18} />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            Busca por Padrões
          </h1>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
            Casamento de padrões via KMP e Boyer-Moore
          </div>
        </div>
      </div>

      {/* Controls */}
      <div
        className="card"
        style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18, marginBottom: 18 }}
      >
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink-3)",
              display: "block",
              marginBottom: 8,
            }}
          >
            Padrão de busca
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: São Paulo, PENDENTE, admin…"
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              background: "var(--canvas)",
              color: "var(--ink)",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink-3)",
              display: "block",
              marginBottom: 8,
            }}
          >
            Entidade
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ENTIDADES.map((opt) => {
              const active = entidade === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEntidade(opt.value)}
                  className={active ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={loading || !query.trim()}
            className="btn btn-primary"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            background: "var(--red-tint)",
            color: "var(--red)",
            fontSize: 13,
            marginBottom: 18,
          }}
        >
          {error}
        </div>
      )}

      {/* Stats */}
      {result && (
        <>
          <div
            className="card"
            style={{ padding: "14px 20px", display: "flex", gap: 32, marginBottom: 18, flexWrap: "wrap" }}
          >
            <StatChip label="Registros pesquisados" value={String(result.totalRegistros)} />
            <StatChip label="Tempo BM" value={`${result.tempoMs_BM.toFixed(3)} ms`} />
            <StatChip label="Tempo KMP" value={`${result.tempoMs_KMP.toFixed(3)} ms`} />
            <StatChip label="Resultados" value={String(result.resultados.length)} />
          </div>

          {/* Results table */}
          {result.resultados.length === 0 ? (
            <div
              style={{
                padding: "40px 24px",
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 14,
              }}
            >
              Nenhum resultado para &ldquo;{result.padrao}&rdquo;
            </div>
          ) : (
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["ID", "Preview", "Posições BM", "Posições KMP"].map((col) => (
                        <th
                          key={col}
                          style={{
                            padding: "10px 14px",
                            textAlign: "left",
                            fontWeight: 600,
                            fontSize: 11,
                            color: "var(--ink-3)",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.resultados.map((rec, idx) => (
                      <tr
                        key={rec.id}
                        style={{
                          borderBottom:
                            idx < result.resultados.length - 1
                              ? "1px solid var(--border)"
                              : "none",
                          background: "transparent",
                        }}
                      >
                        <td
                          style={{
                            padding: "10px 14px",
                            fontWeight: 600,
                            color: "var(--ink)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          #{rec.id}
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            color: "var(--ink-3)",
                            maxWidth: 280,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={rec.preview}
                        >
                          {rec.preview || "—"}
                        </td>
                        <td style={{ padding: "10px 14px", color: "var(--ink)", whiteSpace: "nowrap" }}>
                          {rec.ocorrenciasBM.length > 0
                            ? rec.ocorrenciasBM.map((m) => m.posicao).join(", ")
                            : "—"}
                        </td>
                        <td style={{ padding: "10px 14px", color: "var(--ink)", whiteSpace: "nowrap" }}>
                          {rec.ocorrenciasKMP.length > 0
                            ? rec.ocorrenciasKMP.map((m) => m.posicao).join(", ")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--ink-3)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}
