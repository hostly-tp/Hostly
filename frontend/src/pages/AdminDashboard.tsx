import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  CalendarDays,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Activity,
  FileArchive,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  dashboardService,
  backupService,
  type DashboardStats,
  type BackupInfo,
} from "../services/api";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [latestBackup, setLatestBackup] = useState<BackupInfo | null>(null);
  const [backupCount, setBackupCount] = useState(0);

  useEffect(() => {
    dashboardService.getStats().then(setStats).finally(() => setLoading(false));
    backupService.list().then((list) => {
      setBackupCount(list.length);
      if (list.length > 0) {
        // Most recent backup is the last alphabetically (timestamp in filename)
        const sorted = [...list].sort((a, b) => b.arquivo.localeCompare(a.arquivo));
        setLatestBackup(sorted[0]);
      }
    }).catch(() => {/* ignore */});
  }, []);

  const sections = [
    {
      label: "Imóveis",
      description: "Gerencie todos os imóveis da plataforma",
      icon: <Building2 size={22} />,
      color: "var(--accent)",
      to: "/admin/properties",
      value: stats?.totalImoveis,
    },
    {
      label: "Usuários",
      description: "Administre anfitriões e hóspedes",
      icon: <Users size={22} />,
      color: "var(--blue)",
      to: "/admin/users",
      value: stats?.totalAnfitrioes,
    },
    {
      label: "Reservas",
      description: "Monitore todas as reservas ativas",
      icon: <CalendarDays size={22} />,
      color: "var(--green)",
      to: "/admin/reservations",
      value: stats?.totalReservas,
    },
    {
      label: "Comodidades",
      description: "Gerencie o catálogo de comodidades",
      icon: <Sparkles size={22} />,
      color: "var(--amber)",
      to: "/admin/amenities",
      value: null,
    },
  ];

  return (
    <div style={{ padding: "32px 36px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Activity size={20} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Painel Administrativo
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.04em", margin: 0 }}>
          Operações da Plataforma
        </h1>
      </div>

      {/* Platform KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        <BigKpi
          label="Imóveis ativos"
          value={loading ? "—" : String(stats?.totalImoveis ?? 0)}
          icon={<Building2 size={24} />}
          color="var(--accent)"
        />
        <BigKpi
          label="Reservas totais"
          value={loading ? "—" : String(stats?.totalReservas ?? 0)}
          icon={<CalendarDays size={24} />}
          color="var(--blue)"
        />
        <BigKpi
          label="Receita da plataforma"
          value={loading ? "—" : fmt(stats?.receitaTotal ?? 0)}
          icon={<TrendingUp size={24} />}
          color="var(--green)"
          isText
        />
      </div>

      {/* Section cards */}
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>
          Gerenciamento
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {sections.map((s) => (
            <button
              key={s.to}
              onClick={() => navigate(s.to)}
              className="card card-hover"
              style={{
                padding: "22px 24px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-md)",
                  background: `${s.color}14`,
                  color: s.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{s.label}</span>
                  {s.value != null && (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "99px",
                        background: `${s.color}14`,
                        color: s.color,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {loading ? "—" : s.value}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{s.description}</div>
              </div>
              <ArrowRight size={16} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>

      {/* Data integrity / backup status */}
      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px" }}>
          Integridade dos Dados
        </h2>
        <div
          className="card"
          style={{
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--radius-md)",
              background: latestBackup ? "var(--green-tint, #e6f9f0)" : "var(--canvas)",
              color: latestBackup ? "var(--green)" : "var(--ink-4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {latestBackup ? <CheckCircle2 size={20} /> : <FileArchive size={20} />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>
              {latestBackup
                ? `${backupCount} backup(s) disponível(is)`
                : "Nenhum backup criado ainda"}
            </div>
            {latestBackup ? (
              <div style={{ fontSize: 12, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    padding: "1px 6px",
                    borderRadius: 99,
                    background: "var(--accent-tint)",
                    color: "var(--accent)",
                    fontWeight: 700,
                    fontSize: 10,
                    textTransform: "uppercase",
                  }}
                >
                  {latestBackup.algoritmo}
                </span>
                <span>{formatBytes(latestBackup.tamanho)}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={11} /> {latestBackup.criadoEm}
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                Backups são criados automaticamente a cada 5 operações de escrita — Huffman e LZW alternados.
              </div>
            )}
          </div>

          {latestBackup && (
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-4)",
                fontFamily: "monospace",
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              title={latestBackup.arquivo}
            >
              {latestBackup.arquivo}
            </div>
          )}
        </div>
      </div>

      {/* Explore shortcut */}
      <div
        style={{
          marginTop: 16,
          padding: "18px 24px",
          borderRadius: "var(--radius-xl)",
          background: "var(--canvas)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 13, color: "var(--ink-3)", flex: 1 }}>
          Explore o mapa da plataforma para ver a distribuição geográfica dos imóveis.
        </div>
        <button
          onClick={() => navigate("/explore")}
          className="btn btn-secondary btn-sm"
          style={{ flexShrink: 0 }}
        >
          Ver mapa <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

function BigKpi({ label, value, icon, color, isText }: { label: string; value: string; icon: React.ReactNode; color: string; isText?: boolean }) {
  return (
    <div
      style={{
        padding: "24px",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: -10, right: -10, opacity: 0.06, color }}>
        <span style={{ fontSize: 80 }}>{icon}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: "var(--radius-xs)", background: `${color}18`, color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: isText ? 20 : 32, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.05em", marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 500 }}>{label}</div>
    </div>
  );
}
