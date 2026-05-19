"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getTherapistFeed, getMyPatients } from "@/lib/api";
import { Post, User } from "@/types";
import Navbar from "@/components/Navbar";
import { Loader2, Users, BookOpen } from "lucide-react";

function EmotionBadge({ label }: { label: string }) {
  return (
    <span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-brand-100 text-brand-700 rounded-full">
      {label}
    </span>
  );
}

export default function TherapistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [filterPatient, setFilterPatient] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "therapist") { router.replace("/"); return; }

    Promise.all([getTherapistFeed(), getMyPatients()])
      .then(([feed, pts]) => {
        setPosts((feed as Post[]) ?? []);
        setPatients((pts as User[]) ?? []);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const filtered =
    filterPatient === "all"
      ? posts
      : posts.filter((p) => p.author_id === filterPatient);

  const patientName = (id: string) =>
    patients.find((p) => p.id === id)?.full_name ?? "Unknown";

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Patient Feed</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              <Users className="w-4 h-4 inline mr-1" />
              {patients.length} patient{patients.length !== 1 ? "s" : ""} assigned
            </p>
          </div>

          <select
            value={filterPatient}
            onChange={(e) => setFilterPatient(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="all">All patients</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No entries yet</p>
            <p className="text-sm mt-1">Your patients haven&apos;t posted anything.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((post) => {
              const date = new Date(post.created_at).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <article
                  key={post.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-brand-700">
                      {patientName(post.author_id)}
                    </span>
                    <span className="text-xs text-slate-400">{date}</span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>
                  {post.emotions?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.emotions.map((e) => (
                        <EmotionBadge key={e.id} label={e.label} />
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
