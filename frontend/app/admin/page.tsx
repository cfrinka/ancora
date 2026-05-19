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
import { Loader2, Plus, Trash2, Pencil, Check, X } from "lucide-react";

type Tab = "therapists" | "patients" | "emotions";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "therapists", label: "Therapists" },
    { key: "patients", label: "Patients" },
    { key: "emotions", label: "Emotions" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Administration Dashboard</h1>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-slate-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition -mb-px border-b-2 ${
                tab === t.key
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Therapists tab ── */}
        {tab === "therapists" && (
          <div className="space-y-5">
            <form onSubmit={handleCreateTherapist} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-slate-700">Invite New Therapist</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <input
                  type="text" placeholder="Full name" required value={thName}
                  onChange={(e) => setThName(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  type="email" placeholder="Email" required value={thEmail}
                  onChange={(e) => setThEmail(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  type="password" placeholder="Temporary password" required value={thPwd}
                  onChange={(e) => setThPwd(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              {thError && <p className="text-sm text-red-600">{thError}</p>}
              <button
                type="submit" disabled={thSaving}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
              >
                <Plus className="w-4 h-4" />{thSaving ? "Creating…" : "Create Therapist"}
              </button>
            </form>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {therapists.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-3 font-medium text-slate-800">{t.full_name}</td>
                      <td className="px-4 py-3 text-slate-500">{t.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          {t.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {therapists.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No therapists yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Patients tab ── */}
        {tab === "patients" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Assigned Therapist</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => {
                  const currentTherapist = therapists.find((t) => t.id === p.therapist_id);
                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-medium text-slate-800">{p.full_name}</td>
                      <td className="px-4 py-3 text-slate-500">{p.email}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {currentTherapist ? currentTherapist.full_name : <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3">
                        {assigningId === p.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={assignTarget}
                              onChange={(e) => setAssignTarget(e.target.value)}
                              className="text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            >
                              <option value="">Select therapist</option>
                              {therapists.map((t) => (
                                <option key={t.id} value={t.id}>{t.full_name}</option>
                              ))}
                            </select>
                            <button onClick={() => handleAssign(p.id)} className="text-green-600 hover:text-green-800">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setAssigningId(null)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAssigningId(p.id); setAssignTarget(p.therapist_id ?? ""); }}
                            className="text-xs text-brand-600 hover:underline"
                          >
                            {currentTherapist ? "Reassign" : "Assign"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {patients.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No patients found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Emotions tab ── */}
        {tab === "emotions" && (
          <div className="space-y-5">
            <form onSubmit={handleCreateEmotion} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-slate-700">Add New Emotion</h2>
              <div className="flex gap-3">
                <input
                  type="text" placeholder="e.g. Peaceful" required value={emLabel}
                  onChange={(e) => setEmLabel(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit" disabled={emSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />{emSaving ? "Adding…" : "Add"}
                </button>
              </div>
              {emError && <p className="text-sm text-red-600">{emError}</p>}
            </form>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Label</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {emotions.map((em) => (
                    <tr key={em.id}>
                      <td className="px-4 py-3">
                        {editingEmId === em.id ? (
                          <input
                            value={editingEmLabel}
                            onChange={(e) => setEditingEmLabel(e.target.value)}
                            className="px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                        ) : (
                          <span className="font-medium text-slate-800">{em.label}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${em.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          {em.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {editingEmId === em.id ? (
                            <>
                              <button onClick={() => handleUpdateEmotion(em.id, em.is_active)} className="text-green-600 hover:text-green-800">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingEmId(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setEditingEmId(em.id); setEditingEmLabel(em.label); }}
                                className="text-slate-400 hover:text-brand-600"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => adminUpdateEmotion(em.id, em.label, !em.is_active).then((updated) =>
                                  setEmotions((prev) => prev.map((e) => (e.id === em.id ? updated as Emotion : e)))
                                )}
                                className={`text-xs ${em.is_active ? "text-amber-500 hover:text-amber-700" : "text-green-600 hover:text-green-800"}`}
                              >
                                {em.is_active ? "Deactivate" : "Activate"}
                              </button>
                              <button onClick={() => handleDeleteEmotion(em.id)} className="text-slate-300 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {emotions.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No emotions defined</td></tr>
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
