"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getPatientFeed, createPost, getActiveEmotions } from "@/lib/api";
import { Post, Emotion } from "@/types";
import Navbar from "@/components/Navbar";
import { PlusCircle, X, ChevronDown, Loader2 } from "lucide-react";

function EmotionBadge({ label }: { label: string }) {
  return (
    <span className="inline-block px-2.5 py-0.5 text-xs font-medium bg-brand-100 text-brand-700 rounded-full">
      {label}
    </span>
  );
}

function PostCard({ post }: { post: Post }) {
  const date = new Date(post.created_at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
      {post.emotions?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.emotions.map((e) => (
            <EmotionBadge key={e.id} label={e.label} />
          ))}
        </div>
      )}
      <p className="text-xs text-slate-400">{date}</p>
    </article>
  );
}

export default function PatientPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "patient") { router.replace("/"); return; }

    Promise.all([getPatientFeed(), getActiveEmotions()])
      .then(([feed, ems]) => {
        setPosts(feed as Post[]);
        setEmotions(ems as Emotion[]);
      })
      .finally(() => setLoadingPosts(false));
  }, [user, authLoading, router]);

  const toggleEmotion = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) { setError("Content cannot be empty."); return; }
    setError("");
    setSubmitting(true);
    try {
      const newPost = await createPost(content.trim(), selectedIds) as Post;
      setPosts((prev) => [newPost, ...prev]);
      setContent("");
      setSelectedIds([]);
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loadingPosts) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">My Journal</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition"
          >
            {showForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            {showForm ? "Cancel" : "New Entry"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                How are you feeling? <span className="text-red-400">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="Write your thoughts here…"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Emotions <span className="text-slate-400 text-xs">(select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {emotions.map((em) => (
                  <button
                    key={em.id}
                    type="button"
                    onClick={() => toggleEmotion(em.id)}
                    className={`px-3 py-1 text-sm rounded-full border transition ${
                      selectedIds.includes(em.id)
                        ? "bg-brand-600 border-brand-600 text-white"
                        : "bg-white border-slate-300 text-slate-600 hover:border-brand-400"
                    }`}
                  >
                    {em.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-lg transition text-sm"
            >
              {submitting ? "Saving…" : "Save Entry"}
            </button>
          </form>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ChevronDown className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No entries yet</p>
            <p className="text-sm mt-1">Tap "New Entry" to start journaling.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
