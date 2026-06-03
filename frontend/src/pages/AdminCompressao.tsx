import { useEffect, useState } from "react";
import { FileArchive, RotateCcw, CheckCircle2, Clock } from "lucide-react";
import {
  backupService,
  type AlgoritmoCompressao,
  type BackupResult,
  type BackupInfo,
  type RestoreResult,
} from "../services/api";

const ALGORITMOS: { value: AlgoritmoCompressao; label: string; desc: string }[] = [
  { value: "huffman", label: "Huffman", desc: "Codificação por frequência de símbolos" },
  { value: "lzw", label: "LZW", desc: "Substituição de sequências por códigos" },
];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminCompressao() {
  const [algoritmo, setAlgoritmo] = useState<AlgoritmoCompressao>("huffman");
  const [creating, setCreating] = useState(false);
  const [backupResult, setBackupResult] = useState<BackupResult | null>(null);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [restoringFile, setRestoringFile] = useState<string | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBackups = async () => {
    setLoadingBackups(true);
    try {
      const data = await backupService.list();
      setBackups(data);
    } catch {
      // silently fail — list will just be empty
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    void loadBackups();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setBackupResult(null);
    setRestoreResult(null);
    try {
      const result = await backupService.create(algoritmo);
      setBackupResult(result);
      await loadBackups();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar backup");
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (arquivo: string) => {
    setRestoringFile(arquivo);
    setError(null);
    setRestoreResult(null);
    try {
      const result = await backupService.restore(arquivo);
      setRestoreResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao restaurar backup");
    } finally {
      setRestoringFile(null);
    }
  };

  const ratioPct = backupResult ? backupResult.taxa * 100 : 0;

  return (
    <div style={{ padding: "28px 36px", maxWidth: 820, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
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
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            Backup de Dados
          </h1>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
            Compressão Huffman / LZW — arquivo único com todos os dados do sistema
          </div>
        </div>
      </div>

      {/* Create backup card */}
      <div className="card" style={{ padding: 24, marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 16 }}>
          Criar novo backup
        </div>

        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--ink-3)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 10,
            }}
          >
            Algoritmo de compressão
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {ALGORITMOS.map((opt) => {
              const active = algoritmo === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAlgoritmo(opt.value)}
                  className={active ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, padding: "8px 14px" }}
                >
                  <span style={{ fontWeight: 700 }}>{opt.label}</span>
                  <span style={{ fontSize: 10, opacity: 0.75, fontWeight: 400 }}>{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={creating}
            className="btn btn-primary"
          >
            {creating ? "Comprimindo…" : "Criar Backup"}
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

      {/* Backup result */}
      {backupResult && (
        <div className="card" style={{ padding: 20, marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
              color: "var(--green)",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            <CheckCircle2 size={16} />
            Backup criado com sucesso
          </div>

          <div
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              color: "var(--ink-3)",
              background: "var(--canvas)",
              padding: "6px 10px",
              borderRadius: "var(--radius-md)",
              marginBottom: 14,
            }}
          >
            {backupResult.arquivo}
          </div>

          <div style={{ display: "flex", gap: 28, flexWrap: "wrap", marginBottom: 14 }}>
            <Stat label="Dados originais" value={formatBytes(backupResult.tamanhoTotal)} />
            <Stat label="Tamanho backup" value={formatBytes(backupResult.tamanhoBackup)} />
            <Stat
              label="Taxa"
              value={`${ratioPct.toFixed(1)}% do original`}
              tone={backupResult.taxa > 1 ? "warn" : "good"}
            />
            <Stat label="Arquivos" value={String(backupResult.arquivos.length)} />
          </div>

          <div>
            <div
              style={{
                height: 6,
                background: "var(--border)",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(backupResult.taxa, 1) * 100}%`,
                  height: "100%",
                  background: backupResult.taxa > 1 ? "var(--red)" : "var(--accent)",
                  transition: "width 300ms ease",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Restore result */}
      {restoreResult && (
        <div
          className="card"
          style={{
            padding: 16,
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderColor: "var(--green)",
          }}
        >
          <CheckCircle2 size={20} color="var(--green)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--green)" }}>
              Restaurado com sucesso
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
              {restoreResult.arquivos.length} arquivo(s) restaurado(s) de{" "}
              <code style={{ fontFamily: "monospace" }}>{restoreResult.arquivo}</code>
            </div>
          </div>
        </div>
      )}

      {/* Backup list */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            Backups disponíveis
          </span>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
            {backups.length} arquivo(s)
          </span>
        </div>

        {loadingBackups ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
            Carregando…
          </div>
        ) : backups.length === 0 ? (
          <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
            Nenhum backup encontrado. Crie o primeiro backup acima.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Arquivo", "Algoritmo", "Tamanho", "Data", ""].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: "10px 16px",
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
                {backups.map((b, idx) => (
                  <tr
                    key={b.arquivo}
                    style={{
                      borderBottom: idx < backups.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <td
                      style={{
                        padding: "10px 16px",
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: "var(--ink)",
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={b.arquivo}
                    >
                      {b.arquivo}
                    </td>
                    <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 99,
                          fontSize: 11,
                          fontWeight: 700,
                          background: "var(--accent-tint)",
                          color: "var(--accent)",
                          textTransform: "uppercase",
                        }}
                      >
                        {b.algoritmo}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                      {formatBytes(b.tamanho)}
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        color: "var(--ink-3)",
                        whiteSpace: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Clock size={12} />
                      {b.criadoEm}
                    </td>
                    <td style={{ padding: "10px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={restoringFile === b.arquivo}
                        onClick={() => void handleRestore(b.arquivo)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        <RotateCcw size={12} />
                        {restoringFile === b.arquivo ? "Restaurando…" : "Restaurar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
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
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "var(--ink-3)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color, marginTop: 2 }}>{value}</div>
    </div>
  );
}
