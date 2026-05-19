"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getTherapistFeed, getMyPatients } from "@/lib/api";
import { Post, User } from "@/types";
import Navbar from "@/components/Navbar";
import { Loader2 } from "lucide-react";

function EmotionTag({ label }: { label: string }) {
  return (
    <span className="inline-block px-3 py-1 text-[11px] font-medium tracking-wide border border-olive-border text-olive-muted rounded-full bg-olive-light">
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
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <Loader2 className="w-5 h-5 text-olive animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-12 space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-lg font-medium text-ink tracking-tight">Patient Feed</h1>
            <p className="text-sm text-warm-400 font-light mt-0.5">
              {patients.length} patient{patients.length !== 1 ? "s" : ""} assigned
            </p>
          </div>

          <select
            value={filterPatient}
            onChange={(e) => setFilterPatient(e.target.value)}
            className="px-4 py-2 text-sm bg-canvas border border-warm-300 text-ink rounded-card focus:outline-none focus:border-olive transition-colors duration-150"
          >
            <option value="all">All patients</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>

        {/* Feed */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-sm text-warm-400 font-light">No entries yet.</p>
            <p className="text-xs text-warm-300 mt-1">Your patients haven&apos;t written anything.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((post) => {
              const date = new Date(post.created_at).toLocaleDateString(undefined, {
                month: "long", day: "numeric", year: "numeric",
              });
              const time = new Date(post.created_at).toLocaleTimeString(undefined, {
                hour: "2-digit", minute: "2-digit",
              });
              return (
                <article
                  key={post.id}
                  className="bg-warm-50 rounded-card border border-warm-200 shadow-card p-6 space-y-4 hover:shadow-card-hover transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-[11px] font-semibold tracking-widest uppercase text-olive-muted">
                      {patientName(post.author_id)}
                    </span>
                    <span className="text-[11px] text-warm-400 whitespace-nowrap shrink-0">
                      {date} &middot; {time}
                    </span>
                  </div>
                  <p className="text-ink text-sm leading-7 whitespace-pre-wrap font-light">
                    {post.content}
                  </p>
                  {post.emotions?.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {post.emotions.map((e) => (
                        <EmotionTag key={e.id} label={e.label} />
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
