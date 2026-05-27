import { useEffect, useState, useCallback } from "react";
import { Search, Plus, Edit2, Trash2, Users, Eye, EyeOff } from "lucide-react";
import { usuarioService, type Usuario, type CreateUsuarioInput } from "../services/api";

function statusInfo(tipo: string) {
  if (tipo === "ADMIN") return { label: "Admin", cls: "badge-red" };
  if (tipo === "ANFITRIAO") return { label: "Anfitrião", cls: "badge-blue" };
  return { label: "Hóspede", cls: "badge-ink" };
}

type View = "list" | "form";
interface FormState {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  tipo: Usuario["tipo"];
  ativo: boolean;
}
const EMPTY_FORM: FormState = { nome: "", email: "", telefone: "", senha: "", tipo: "HOSPEDE", ativo: true };

export default function AdminUsers() {
  const [view, setView] = useState<View>("list");
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showPw, setShowPw] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usuarioService.getAll(search ? { busca: search } : undefined);
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setView("form");
  };

  const openEdit = (u: Usuario) => {
    setEditing(u);
    setForm({ nome: u.nome, email: u.email, telefone: u.telefone ?? "", senha: "", tipo: u.tipo, ativo: u.ativo });
    setError(null);
    setView("form");
  };

  const handleDelete = async (u: Usuario) => {
    if (!confirm(`Excluir "${u.nome}"?`)) return;
    setDeleting(u.idUsuario);
    try {
      await usuarioService.delete(u.idUsuario);
      setUsers((prev) => prev.filter((x) => x.idUsuario !== u.idUsuario));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir");
    } finally {
      setDeleting(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: CreateUsuarioInput = {
        nome: form.nome,
        email: form.email,
        telefone: form.telefone || undefined,
        tipo: form.tipo,
        ativo: form.ativo,
        ...(form.senha ? { senha: form.senha } : {}),
      };
      if (editing) {
        await usuarioService.update(editing.idUsuario, payload);
      } else {
        await usuarioService.create(payload);
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
      <div style={{ padding: "28px 36px", maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: "var(--ink-3)", fontSize: 13, fontWeight: 600 }}>
            ← Voltar
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            {editing ? "Editar usuário" : "Novo usuário"}
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <FormField label="Nome">
            <input className="field-input" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required />
          </FormField>
          <FormField label="Email">
            <input className="field-input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </FormField>
          <FormField label="Telefone">
            <input className="field-input" value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} />
          </FormField>
          <FormField label={editing ? "Senha (deixe vazio para manter)" : "Senha"}>
            <div style={{ position: "relative" }}>
              <input className="field-input" type={showPw ? "text" : "password"} value={form.senha} onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))} required={!editing} style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPw((v) => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--ink-4)", display: "flex", padding: 0 }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </FormField>
          <FormField label="Tipo">
            <select className="field-input" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as Usuario["tipo"] }))}>
              <option value="HOSPEDE">Hóspede</option>
              <option value="ANFITRIAO">Anfitrião</option>
              <option value="ADMIN">Admin</option>
            </select>
          </FormField>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
            <input type="checkbox" checked={form.ativo} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "var(--accent)" }} />
            Usuário ativo
          </label>
          {error && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--red-tint)", color: "var(--red)", fontSize: 13 }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.04em", margin: "0 0 4px" }}>Usuários</h1>
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>{users.length} usuário(s)</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-4)", pointerEvents: "none" }} />
            <input className="field-input" style={{ paddingLeft: 34 }} placeholder="Buscar usuário..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <button onClick={openNew} className="btn btn-primary"><Plus size={14} /> Novo usuário</button>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div className="anim-spin" style={{ width: 24, height: 24, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", margin: "0 auto" }} />
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Users size={36} style={{ color: "var(--ink-5)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, color: "var(--ink-3)", margin: 0 }}>Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Email</th>
                <th>Tipo</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const { label, cls } = statusInfo(u.tipo);
                const initials = u.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <tr key={u.idUsuario}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-tint)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{u.nome}</div>
                          {u.telefone && <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{u.telefone}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{u.email}</td>
                    <td><span className={`badge ${cls}`}>{label}</span></td>
                    <td><span className={`badge ${u.ativo ? "badge-green" : "badge-ink"}`}>{u.ativo ? "Ativo" : "Inativo"}</span></td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={() => openEdit(u)} className="btn btn-ghost btn-sm" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Edit2 size={13} /> Editar
                        </button>
                        <button onClick={() => handleDelete(u)} disabled={deleting === u.idUsuario}
                          style={{ padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--red-tint)", color: "var(--red)", display: "flex", alignItems: "center", fontSize: 12 }}>
                          {deleting === u.idUsuario ? "..." : <Trash2 size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
