import { useEffect, useState, useCallback } from "react";
import { Plus, Sparkles, Edit2, Trash2, ChevronLeft } from "lucide-react";
import { comodidadeService, type ComodidadeCatalogo, type CreateComodidadeInput } from "../services/api";

type View = "list" | "form";
interface FormState {
  nome: string;
  descricao: string;
  icone: string;
  ativo: boolean;
}
const EMPTY: FormState = { nome: "", descricao: "", icone: "", ativo: true };

export default function AdminAmenities() {
  const [view, setView] = useState<View>("list");
  const [items, setItems] = useState<ComodidadeCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ComodidadeCatalogo | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await comodidadeService.getAll();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openNew = () => { setEditing(null); setForm(EMPTY); setError(null); setView("form"); };
  const openEdit = (c: ComodidadeCatalogo) => {
    setEditing(c);
    setForm({ nome: c.nome, descricao: c.descricao ?? "", icone: c.icone ?? "", ativo: c.ativo });
    setError(null);
    setView("form");
  };

  const handleDelete = async (c: ComodidadeCatalogo) => {
    if (!confirm(`Excluir "${c.nome}"?`)) return;
    setDeleting(c.idComodidade);
    try {
      await comodidadeService.delete(c.idComodidade);
      setItems((prev) => prev.filter((x) => x.idComodidade !== c.idComodidade));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (c: ComodidadeCatalogo) => {
    try {
      const updated = await comodidadeService.update(c.idComodidade, { ativo: !c.ativo });
      setItems((prev) => prev.map((x) => x.idComodidade === c.idComodidade ? updated : x));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: CreateComodidadeInput = { nome: form.nome, descricao: form.descricao || undefined, icone: form.icone || undefined, ativo: form.ativo };
      if (editing) {
        await comodidadeService.update(editing.idComodidade, payload);
      } else {
        await comodidadeService.create(payload);
      }
      await fetch();
      setView("list");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "form") {
    return (
      <div style={{ padding: "28px 36px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: "var(--ink-3)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <ChevronLeft size={16} /> Voltar
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            {editing ? "Editar comodidade" : "Nova comodidade"}
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: 6 }}>Nome *</label>
            <input className="field-input" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required minLength={2} placeholder="Ex: Wi-Fi" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: 6 }}>Descrição</label>
            <textarea className="field-input" rows={2} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Descrição opcional..." style={{ resize: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: 6 }}>Ícone (slug)</label>
            <input className="field-input" value={form.icone} onChange={(e) => setForm((f) => ({ ...f, icone: e.target.value }))} placeholder="Ex: wifi, pool, gym" />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
            <input type="checkbox" checked={form.ativo} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "var(--accent)" }} />
            Comodidade ativa
          </label>
          {error && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--red-tint)", color: "var(--red)", fontSize: 13 }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setView("list")} className="btn btn-secondary">Cancelar</button>
            <button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? "Salvando..." : editing ? "Salvar" : "Criar"}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 36px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.04em", margin: "0 0 4px" }}>Comodidades</h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>{items.length} comodidade(s) no catálogo</p>
        </div>
        <button onClick={openNew} className="btn btn-primary"><Plus size={14} /> Nova comodidade</button>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} style={{ height: 100, borderRadius: "var(--radius-lg)", background: "var(--canvas)" }} />)}
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: 64, textAlign: "center" }}>
          <Sparkles size={40} style={{ color: "var(--ink-5)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, color: "var(--ink-3)", margin: "0 0 16px" }}>Nenhuma comodidade cadastrada.</p>
          <button onClick={openNew} className="btn btn-primary btn-sm"><Plus size={13} /> Criar primeira</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {items.map((c) => (
            <div key={c.idComodidade} className="card" style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>{c.nome}</div>
                  {c.icone && <div style={{ fontSize: 11, color: "var(--ink-4)", fontFamily: "monospace" }}>{c.icone}</div>}
                </div>
                <button
                  onClick={() => handleToggle(c)}
                  className={`badge ${c.ativo ? "badge-green" : "badge-ink"}`}
                  style={{ border: "none", cursor: "pointer", flexShrink: 0 }}
                >
                  {c.ativo ? "Ativa" : "Inativa"}
                </button>
              </div>
              {c.descricao && <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "0 0 12px", lineHeight: 1.5 }}>{c.descricao}</p>}
              <div style={{ display: "flex", gap: 6, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                <button onClick={() => openEdit(c)} className="btn btn-ghost btn-sm" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Edit2 size={12} /> Editar
                </button>
                <button onClick={() => handleDelete(c)} disabled={deleting === c.idComodidade}
                  style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--red-tint)", color: "var(--red)", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                  {deleting === c.idComodidade ? "..." : <><Trash2 size={12} /></>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
