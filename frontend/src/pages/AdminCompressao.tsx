import { useState } from "react";
import { FileArchive, CheckCircle2, XCircle } from "lucide-react";
import {
  compressaoService,
  type AlgoritmoCompressao,
  type CompressaoResult,
  type DescompressaoResult,
  type EntidadeCompactavel,
} from "../services/api";

const ENTIDADES: { value: EntidadeCompactavel; label: string }[] = [
  { value: "imoveis", label: "Imóveis" },
  { value: "usuarios", label: "Usuários" },
  { value: "reservas", label: "Reservas" },
];

const ALGORITMOS: { value: AlgoritmoCompressao; label: string }[] = [
  { value: "huffman", label: "Huffman" },
  { value: "lzw", label: "LZW" },
];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminCompressao() {
  const [entidade, setEntidade] = useState<EntidadeCompactavel>("imoveis");
  const [algoritmo, setAlgoritmo] = useState<AlgoritmoCompressao>("huffman");
  const [compressing, setCompressing] = useState(false);
  const [decompressing, setDecompressing] = useState(false);
  const [result, setResult] = useState<CompressaoResult | null>(null);
  const [verification, setVerification] = useState<DescompressaoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetResults = () => {
    setResult(null);
    setVerification(null);
    setError(null);
  };

  const handleCompress = async () => {
    setCompressing(true);
    setError(null);
    setVerification(null);
    try {
      const data = await compressaoService.compress(entidade, algoritmo);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao comprimir");
      setResult(null);
    } finally {
      setCompressing(false);
    }
  };

  const handleDecompress = async () => {
    if (!result) return;
    setDecompressing(true);
    setError(null);
    try {
      const data = await compressaoService.decompress(
        result.algoritmo,
        result.dadosComprimidos,
        result.tamanhoOriginal,
      );
      setVerification(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao descomprimir");
      setVerification(null);
    } finally {
      setDecompressing(false);
    }
  };

  const ratioPct = result ? result.taxa * 100 : 0;
  const fillWidth = result ? Math.min(result.taxa, 1) * 100 : 0;
  const preview = result
    ? result.dadosComprimidos.slice(0, 80) +
      (result.dadosComprimidos.length > 80 ? "…" : "")
    : "";

  return (
    <div style={{ padding: "28px 36px", maxWidth: 720, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
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
          <FileArchive size={18} />
        </div>
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            Compressão
          </h1>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
            Comprime e verifica arquivos de dados (Huffman / LZW)
          </div>
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          marginBottom: 18,
        }}
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
            Entidade
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ENTIDADES.map((opt) => {
              const active = entidade === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setEntidade(opt.value);
                    resetResults();
                  }}
                  className={active ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
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
            Algoritmo
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {ALGORITMOS.map((opt) => {
              const active = algoritmo === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setAlgoritmo(opt.value);
                    resetResults();
                  }}
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
            onClick={handleCompress}
            disabled={compressing}
            className="btn btn-primary"
          >
            {compressing ? "Comprimindo..." : "Comprimir"}
          </button>
        </div>
      </div>

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

      {result && (
        <div
          className="card"
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <SummaryStat label="Tamanho original" value={formatBytes(result.tamanhoOriginal)} />
            <SummaryStat label="Tamanho comprimido" value={formatBytes(result.tamanhoComprimido)} />
            <SummaryStat
              label="Taxa"
              value={`${ratioPct.toFixed(1)}% do original`}
              tone={result.taxa > 1 ? "warn" : "good"}
            />
          </div>

          <div>
            <div
              style={{
                height: 8,
                background: "var(--border)",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${fillWidth}%`,
                  height: "100%",
                  background:
                    result.taxa > 1 ? "var(--red)" : "var(--accent)",
                  transition: "width 250ms ease",
                }}
              />
            </div>
            {result.taxa > 1 && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: "var(--red)",
                }}
              >
                A saída ficou maior que a entrada (overhead do cabeçalho/dicionário).
              </div>
            )}
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--ink-3)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 6,
              }}
            >
              Prévia (base64)
            </div>
            <div
              style={{
                padding: "10px 12px",
                background: "var(--canvas)",
                borderRadius: "var(--radius-md)",
                fontFamily: "monospace",
                fontSize: 12,
                color: "var(--ink-3)",
                wordBreak: "break-all",
              }}
            >
              {preview || "(vazio)"}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleDecompress}
              disabled={decompressing}
              className="btn btn-secondary"
            >
              {decompressing ? "Descomprimindo..." : "Descomprimir"}
            </button>
          </div>
        </div>
      )}

      {verification && (
        <div
          className="card"
          style={{
            padding: 18,
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderColor: verification.verificado ? "var(--green)" : "var(--red)",
          }}
        >
          {verification.verificado ? (
            <CheckCircle2 size={22} color="var(--green)" />
          ) : (
            <XCircle size={22} color="var(--red)" />
          )}
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: verification.verificado ? "var(--green)" : "var(--red)",
              }}
            >
              {verification.verificado ? "Verificado" : "Falhou"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
              {verification.verificado
                ? `Restaurado ${formatBytes(verification.tamanhoRestaurado)} (igual ao original).`
                : `Restaurado ${verification.tamanhoRestaurado} bytes, esperado ${verification.tamanhoOriginal}.`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn";
}) {
  const color =
    tone === "warn" ? "var(--red)" : tone === "good" ? "var(--green)" : "var(--ink)";
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
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
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color,
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}
