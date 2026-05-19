"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getPatientFeed, createPost, getActiveEmotions } from "@/lib/api";
import { Post, Emotion } from "@/types";
import Navbar from "@/components/Navbar";
import { useI18n } from "@/lib/i18n/context";
import { localizeEmotion } from "@/lib/i18n/emotions";
import { Loader2, Plus, X } from "lucide-react";

function EmotionTag({ label, locale }: { label: string; locale: string }) {
  return (
    <span className="inline-block px-3 py-1 text-[11px] font-medium tracking-wide border border-olive-border text-olive-muted rounded-full bg-olive-light">
      {localizeEmotion(label, locale)}
    </span>
  );
}

function PostCard({ post, locale }: { post: Post; locale: string }) {
  const date = new Date(post.created_at).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const time = new Date(post.created_at).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="bg-warm-50 rounded-card border border-warm-200 shadow-card p-6 space-y-4 hover:shadow-card-hover transition-shadow duration-200">
      <p className="text-ink text-sm leading-7 whitespace-pre-wrap font-light">{post.content}</p>
      {post.emotions?.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {post.emotions.map((e) => (
            <EmotionTag key={e.id} label={e.label} locale={locale} />
          ))}
        </div>
      )}
      <p className="text-[11px] text-warm-400 tracking-wide pt-1">
        {date} &middot; {time}
      </p>
    </article>
  );
}

export default function PatientPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, locale } = useI18n();
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
        setPosts((feed as Post[]) ?? []);
        setEmotions((ems as Emotion[]) ?? []);
      })
      .finally(() => setLoadingPosts(false));
  }, [user, authLoading, router]);

  const toggleEmotion = (id: number) =>
    setSelectedIds((prev: number[]) =>
      prev.includes(id) ? prev.filter((x: number) => x !== id) : [...prev, id]
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) { setError(t.patient.emptyError); return; }
    setError("");
    setSubmitting(true);
    try {
      const newPost = await createPost(content.trim(), selectedIds) as Post;
      setPosts((prev: Post[]) => [newPost, ...prev]);
      setContent("");
      setSelectedIds([]);
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.patient.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loadingPosts) {
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

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-ink tracking-tight">{t.patient.title}</h1>
            <p className="text-sm text-warm-400 font-light mt-0.5">{t.patient.subtitle}</p>
          </div>
          <button
            onClick={() => setShowForm((v: boolean) => !v)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-card transition-colors duration-150 ${
              showForm
                ? "bg-warm-200 text-warm-700 hover:bg-warm-300"
                : "bg-olive text-canvas hover:bg-olive-hover"
            }`}
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showForm ? t.common.cancel : t.patient.newEntry}
          </button>
        </div>

        {/* Compose form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-warm-50 rounded-card border border-warm-200 shadow-card p-6 space-y-6"
          >
            <div>
              <label className="block text-[11px] font-medium tracking-widest uppercase text-warm-500 mb-3">
                {t.patient.howAreYouFeeling}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-canvas border border-warm-300 rounded-card text-sm text-ink font-light leading-7 placeholder:text-warm-300 focus:outline-none focus:border-olive resize-none transition-colors duration-150"
                placeholder={t.patient.textareaPlaceholder}
              />
            </div>

            {/* Emotion tags */}
            {emotions.length > 0 && (
              <div>
                <label className="block text-[11px] font-medium tracking-widest uppercase text-warm-500 mb-3">
                  {t.patient.emotionsLabel}
                </label>
                <div className="flex flex-wrap gap-2">
                  {emotions.map((em) => {
                    const active = selectedIds.includes(em.id);
                    return (
                      <button
                        key={em.id}
                        type="button"
                        onClick={() => toggleEmotion(em.id)}
                        className={`px-4 py-1.5 text-[11px] font-medium tracking-wide rounded-full border transition-all duration-150 ${
                          active
                            ? "bg-olive border-olive text-canvas"
                            : "bg-olive-light border-olive-border text-olive-muted hover:border-olive hover:text-olive"
                        }`}
                      >
                        {localizeEmotion(em.label, locale)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-warm-700 bg-warm-100 border border-warm-300 rounded-card px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-olive hover:bg-olive-hover disabled:opacity-50 text-canvas text-sm font-medium tracking-wide rounded-card transition-colors duration-150"
            >
              {submitting ? t.common.saving : t.common.save}
            </button>
          </form>
        )}

        {/* Feed */}
        {posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-sm text-warm-400 font-light">{t.patient.noEntries}</p>
            <p className="text-xs text-warm-300 mt-1">{t.patient.noEntriesHint}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((p: Post) => (
              <PostCard key={p.id} post={p} locale={locale} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
