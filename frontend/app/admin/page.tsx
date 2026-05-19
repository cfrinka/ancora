"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  listTherapists, createTherapist,
  listPatients, assignPatient,
  adminListEmotions, adminCreateEmotion, adminUpdateEmotion, adminDeleteEmotion,
} from "@/lib/api";
import { User, Emotion } from "@/types";
import Navbar from "@/components/Navbar";
import { useI18n } from "@/lib/i18n/context";
import { Loader2, Plus, Trash2, Pencil, Check, X } from "lucide-react";

type Tab = "therapists" | "patients" | "emotions";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("therapists");

  const [therapists, setTherapists] = useState<User[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [loading, setLoading] = useState(true);

  // New therapist form
  const [thEmail, setThEmail] = useState("");
  const [thName, setThName] = useState("");
  const [thPwd, setThPwd] = useState("");
  const [thError, setThError] = useState("");
  const [thSaving, setThSaving] = useState(false);

  // New emotion form
  const [emLabel, setEmLabel] = useState("");
  const [emError, setEmError] = useState("");
  const [emSaving, setEmSaving] = useState(false);

  // Inline emotion edit
  const [editingEmId, setEditingEmId] = useState<number | null>(null);
  const [editingEmLabel, setEditingEmLabel] = useState("");

  // Assign patient
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "admin") { router.replace("/"); return; }

    Promise.all([listTherapists(), listPatients(), adminListEmotions()])
      .then(([th, pt, em]) => {
        setTherapists((th as User[]) ?? []);
        setPatients((pt as User[]) ?? []);
        setEmotions((em as Emotion[]) ?? []);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  // Create therapist
  const handleCreateTherapist = async (e: FormEvent) => {
    e.preventDefault();
    setThError("");
    setThSaving(true);
    try {
      const t = await createTherapist(thEmail, thName, thPwd) as User;
      setTherapists((prev) => [...prev, t]);
      setThEmail(""); setThName(""); setThPwd("");
    } catch (err: unknown) {
      setThError(err instanceof Error ? err.message : "Failed");
    } finally {
      setThSaving(false);
    }
  };

  // Create emotion
  const handleCreateEmotion = async (e: FormEvent) => {
    e.preventDefault();
    setEmError("");
    setEmSaving(true);
    try {
      const em = await adminCreateEmotion(emLabel) as Emotion;
      setEmotions((prev) => [...prev, em]);
      setEmLabel("");
    } catch (err: unknown) {
      setEmError(err instanceof Error ? err.message : "Failed");
    } finally {
      setEmSaving(false);
    }
  };

  // Update emotion
  const handleUpdateEmotion = async (id: number, isActive: boolean) => {
    try {
      const em = await adminUpdateEmotion(id, editingEmLabel, isActive) as Emotion;
      setEmotions((prev) => prev.map((e) => (e.id === id ? em : e)));
      setEditingEmId(null);
    } catch { /* silently fail */ }
  };

  // Delete emotion
  const handleDeleteEmotion = async (id: number) => {
    if (!confirm("Delete this emotion? This cannot be undone.")) return;
    await adminDeleteEmotion(id);
    setEmotions((prev) => prev.filter((e) => e.id !== id));
  };

  // Assign patient
  const handleAssign = async (patientId: string) => {
    if (!assignTarget) return;
    await assignPatient(patientId, assignTarget);
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, therapist_id: assignTarget } : p))
    );
    setAssigningId(null);
    setAssignTarget("");
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <Loader2 className="w-5 h-5 text-olive animate-spin" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "therapists", label: t.admin.tabs.therapists },
    { key: "patients", label: t.admin.tabs.patients },
    { key: "emotions", label: t.admin.tabs.emotions },
  ];

  const inputCls = "w-full px-4 py-2.5 bg-canvas border border-warm-300 text-sm text-ink placeholder:text-warm-400 rounded-card focus:outline-none focus:border-olive transition-colors duration-150";
  const btnPrimary = "flex items-center gap-2 px-5 py-2.5 bg-olive hover:bg-olive-hover disabled:opacity-50 text-canvas text-sm font-medium rounded-card transition-colors duration-150";

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">

        <div>
          <h1 className="text-lg font-medium text-ink tracking-tight">{t.admin.title}</h1>
          <p className="text-sm text-warm-400 font-light mt-0.5">{t.admin.subtitle}</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-warm-200">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`px-5 py-3 text-[11px] font-semibold tracking-widest uppercase transition-colors duration-150 -mb-px border-b-2 ${
                tab === tb.key
                  ? "border-olive text-olive"
                  : "border-transparent text-warm-400 hover:text-ink"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* ── Therapists tab ── */}
        {tab === "therapists" && (
          <div className="space-y-6">
            <form onSubmit={handleCreateTherapist} className="bg-warm-50 rounded-card border border-warm-200 shadow-card p-6 space-y-5">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-warm-500">{t.admin.therapists.inviteTitle}</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <input type="text" placeholder={t.admin.therapists.namePlaceholder} required value={thName}
                  onChange={(e) => setThName(e.target.value)} className={inputCls} />
                <input type="email" placeholder={t.admin.therapists.emailPlaceholder} required value={thEmail}
                  onChange={(e) => setThEmail(e.target.value)} className={inputCls} />
                <input type="password" placeholder={t.admin.therapists.passwordPlaceholder} required value={thPwd}
                  onChange={(e) => setThPwd(e.target.value)} className={inputCls} />
              </div>
              {thError && <p className="text-xs text-warm-700 bg-warm-100 border border-warm-300 rounded-card px-4 py-3">{thError}</p>}
              <button type="submit" disabled={thSaving} className={btnPrimary}>
                <Plus className="w-3.5 h-3.5" />{thSaving ? t.common.creating : t.admin.therapists.createBtn}
              </button>
            </form>

            <div className="rounded-card border border-warm-200 shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-warm-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-warm-500">{t.admin.therapists.tableNameCol}</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-warm-500">{t.admin.therapists.tableEmailCol}</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-warm-500">{t.admin.therapists.tableStatusCol}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100 bg-warm-50">
                  {therapists.map((th) => (
                    <tr key={th.id} className="hover:bg-warm-100 transition-colors duration-100">
                      <td className="px-5 py-3.5 text-ink font-medium text-sm">{th.full_name}</td>
                      <td className="px-5 py-3.5 text-warm-500 text-sm">{th.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase ${th.is_active ? "bg-olive-light text-olive border border-olive-border" : "bg-warm-100 text-warm-400 border border-warm-200"}`}>
                          {th.is_active ? t.common.active : t.common.inactive}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {therapists.length === 0 && (
                    <tr><td colSpan={3} className="px-5 py-10 text-center text-sm text-warm-400 font-light">{t.admin.therapists.noTherapists}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Patients tab ── */}
        {tab === "patients" && (
          <div className="rounded-card border border-warm-200 shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-warm-100">
                <tr>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-warm-500">{t.admin.patients.tableNameCol}</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-warm-500">{t.admin.patients.tableEmailCol}</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-warm-500">{t.admin.patients.tableTherapistCol}</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-warm-500">{t.admin.patients.tableActionCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 bg-warm-50">
                {patients.map((p) => {
                  const currentTherapist = therapists.find((th) => th.id === p.therapist_id);
                  return (
                    <tr key={p.id} className="hover:bg-warm-100 transition-colors duration-100">
                      <td className="px-5 py-3.5 text-ink font-medium">{p.full_name}</td>
                      <td className="px-5 py-3.5 text-warm-500">{p.email}</td>
                      <td className="px-5 py-3.5 text-warm-600">
                        {currentTherapist ? currentTherapist.full_name : <span className="text-warm-300 italic text-xs">{t.common.unassigned}</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {assigningId === p.id ? (
                          <div className="flex items-center gap-2">
                            <select value={assignTarget} onChange={(e) => setAssignTarget(e.target.value)}
                              className="text-xs bg-canvas border border-warm-300 text-ink rounded-card px-3 py-1.5 focus:outline-none focus:border-olive">
                              <option value="">{t.admin.patients.selectTherapist}</option>
                              {therapists.map((th) => <option key={th.id} value={th.id}>{th.full_name}</option>)}
                            </select>
                            <button onClick={() => handleAssign(p.id)} className="text-olive hover:text-olive-hover"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setAssigningId(null)} className="text-warm-300 hover:text-warm-600"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => { setAssigningId(p.id); setAssignTarget(p.therapist_id ?? ""); }}
                            className="text-[11px] font-medium text-olive-muted hover:text-olive tracking-wide transition-colors">
                            {currentTherapist ? t.common.reassign : t.common.assign}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {patients.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-warm-400 font-light">{t.admin.patients.noPatients}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Emotions tab ── */}
        {tab === "emotions" && (
          <div className="space-y-6">
            <form onSubmit={handleCreateEmotion} className="bg-warm-50 rounded-card border border-warm-200 shadow-card p-6 space-y-4">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-warm-500">{t.admin.emotions.addTitle}</p>
              <div className="flex gap-3">
                <input type="text" placeholder={t.admin.emotions.labelPlaceholder} required value={emLabel}
                  onChange={(e) => setEmLabel(e.target.value)} className={inputCls} />
                <button type="submit" disabled={emSaving} className={btnPrimary}>
                  <Plus className="w-3.5 h-3.5" />{emSaving ? t.common.adding : t.common.add}
                </button>
              </div>
              {emError && <p className="text-xs text-warm-700 bg-warm-100 border border-warm-300 rounded-card px-4 py-3">{emError}</p>}
            </form>

            <div className="rounded-card border border-warm-200 shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-warm-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-warm-500">{t.admin.emotions.tableLabel}</th>
                    <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-warm-500">{t.admin.emotions.tableStatus}</th>
                    <th className="px-5 py-3 text-right text-[10px] font-semibold tracking-widest uppercase text-warm-500">{t.admin.emotions.tableActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100 bg-warm-50">
                  {emotions.map((em) => (
                    <tr key={em.id} className="hover:bg-warm-100 transition-colors duration-100">
                      <td className="px-5 py-3.5">
                        {editingEmId === em.id ? (
                          <input value={editingEmLabel} onChange={(e) => setEditingEmLabel(e.target.value)}
                            className="px-3 py-1.5 text-sm bg-canvas border border-warm-300 rounded-card focus:outline-none focus:border-olive" />
                        ) : (
                          <span className="font-medium text-ink">{em.label}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase ${em.is_active ? "bg-olive-light text-olive border border-olive-border" : "bg-warm-100 text-warm-400 border border-warm-200"}`}>
                          {em.is_active ? t.common.active : t.common.inactive}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-3">
                          {editingEmId === em.id ? (
                            <>
                              <button onClick={() => handleUpdateEmotion(em.id, em.is_active)} className="text-olive hover:text-olive-hover"><Check className="w-4 h-4" /></button>
                              <button onClick={() => setEditingEmId(null)} className="text-warm-300 hover:text-warm-600"><X className="w-4 h-4" /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditingEmId(em.id); setEditingEmLabel(em.label); }}
                                className="text-warm-300 hover:text-olive transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                              <button
                                onClick={() => adminUpdateEmotion(em.id, em.label, !em.is_active).then((updated) =>
                                  setEmotions((prev: Emotion[]) => prev.map((e: Emotion) => (e.id === em.id ? updated as Emotion : e)))
                                )}
                                className="text-[11px] font-medium text-warm-400 hover:text-ink tracking-wide transition-colors">
                                {em.is_active ? t.common.deactivate : t.common.activate}
                              </button>
                              <button onClick={() => handleDeleteEmotion(em.id)} className="text-warm-200 hover:text-warm-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {emotions.length === 0 && (
                    <tr><td colSpan={3} className="px-5 py-10 text-center text-sm text-warm-400 font-light">{t.admin.emotions.noEmotions}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
