'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2, Upload } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type Mod = {
  key: string;
  id?: string;
  title: string;
  textContent: string;
  videoUrl: string;
};

type CourseDto = {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  isFree: boolean;
  priceAud: number;
  published: boolean;
  modules: {
    id: string;
    title: string;
    textContent: string;
    videoUrl: string;
    orderIndex: number;
  }[];
};

function newModuleKey(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyModule(): Mod {
  return { key: newModuleKey(), title: '', textContent: '', videoUrl: '' };
}

export function CourseEditorForm({ courseId }: { courseId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(!!courseId);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [slugReadOnly, setSlugReadOnly] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [priceAud, setPriceAud] = useState('0');
  const [published, setPublished] = useState(false);
  const [modules, setModules] = useState<Mod[]>([emptyModule()]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load course');
      const data = (await res.json()) as { course: CourseDto };
      const c = data.course;
      setSlugReadOnly(c.slug);
      setTitle(c.title);
      setDescription(c.description);
      setThumbnailUrl(c.thumbnailUrl);
      setIsFree(c.isFree);
      setPriceAud(String(c.priceAud));
      setPublished(c.published);
      setModules(
        c.modules.length > 0
          ? c.modules.map((m) => ({
              key: m.id,
              id: m.id,
              title: m.title,
              textContent: m.textContent,
              videoUrl: m.videoUrl,
            }))
          : [emptyModule()]
      );
    } catch {
      toast({ title: 'Could not load course', variant: 'destructive' });
      router.push('/admin/courses');
    } finally {
      setLoading(false);
    }
  }, [courseId, router, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  function moveModule(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= modules.length) return;
    setModules((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd, credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.detail === 'string' ? data.detail : 'Upload failed');
      }
      if (typeof data.url === 'string') {
        setThumbnailUrl(data.url);
        toast({ title: 'Thumbnail uploaded' });
      }
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Upload failed',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const price = Number.parseFloat(priceAud);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        isFree,
        priceAud: Number.isFinite(price) ? price : 0,
        published,
        modules: modules.map((m) => ({
          id: m.id,
          title: m.title.trim(),
          textContent: m.textContent.trim() || undefined,
          videoUrl: m.videoUrl.trim() || undefined,
        })),
      };

      if (!payload.title) {
        toast({ title: 'Title is required', variant: 'destructive' });
        setSaving(false);
        return;
      }
      if (!payload.modules.some((m) => m.title)) {
        toast({ title: 'Each module needs a title', variant: 'destructive' });
        setSaving(false);
        return;
      }

      const url = courseId ? `/api/admin/courses/${courseId}` : '/api/admin/courses';
      const method = courseId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.detail === 'string' ? data.detail : 'Save failed');
      }
      toast({ title: courseId ? 'Course updated' : 'Course created' });
      router.push('/admin/courses');
      router.refresh();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Save failed',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-white/50">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/courses"
              className="text-xs font-medium text-white/40 transition-colors hover:text-white/70"
            >
              ← Back to courses
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-white/95">
              {courseId ? 'Edit course' : 'New course'}
            </h1>
            {slugReadOnly ? (
              <p className="mt-1 font-mono text-xs text-white/35">Slug: {slugReadOnly}</p>
            ) : null}
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          <section
            className="space-y-4 rounded-xl border border-white/8 p-5"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <h2 className="text-sm font-semibold tracking-wide text-white/80 uppercase">Details</h2>
            <div className="space-y-2">
              <Label className="text-white/70">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="border-white/10 bg-black/30 text-white"
                placeholder="e.g. Water Damage Restoration Essentials"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="border-white/10 bg-black/30 text-white"
                placeholder="Short summary shown on catalogue cards"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Thumbnail URL</Label>
              <Input
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="border-white/10 bg-black/30 text-white"
                placeholder="https://… or /uploads/…"
              />
              <div className="flex flex-wrap items-center gap-2">
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onUploadFile} />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/5 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Upload image
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-2">
                <Switch id="free" checked={isFree} onCheckedChange={setIsFree} />
                <Label htmlFor="free" className="text-white/70">
                  Free course
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="pub" checked={published} onCheckedChange={setPublished} />
                <Label htmlFor="pub" className="text-white/70">
                  Published
                </Label>
              </div>
            </div>
            {!isFree && (
              <div className="space-y-2">
                <Label className="text-white/70">Price (AUD)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={priceAud}
                  onChange={(e) => setPriceAud(e.target.value)}
                  className="max-w-xs border-white/10 bg-black/30 text-white"
                />
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-white/80 uppercase">Modules</h2>
              <button
                type="button"
                onClick={() => setModules((m) => [...m, emptyModule()])}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                style={{ background: '#2490ed' }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add module
              </button>
            </div>

            <div className="space-y-4">
              {modules.map((mod, idx) => (
                <div
                  key={mod.key}
                  className="space-y-3 rounded-xl border border-white/8 p-4"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white/45">Module {idx + 1}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
                        onClick={() => moveModule(idx, -1)}
                        disabled={idx === 0}
                        aria-label="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
                        onClick={() => moveModule(idx, 1)}
                        disabled={idx === modules.length - 1}
                        aria-label="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-red-400/80 hover:bg-red-500/15"
                        onClick={() => setModules((m) => m.filter((_, i) => i !== idx))}
                        disabled={modules.length <= 1}
                        aria-label="Remove module"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Module title</Label>
                    <Input
                      value={mod.title}
                      onChange={(e) =>
                        setModules((m) => m.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))
                      }
                      required
                      className="border-white/10 bg-black/30 text-white"
                      placeholder="Required"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Reading / text (optional)</Label>
                    <Textarea
                      value={mod.textContent}
                      onChange={(e) =>
                        setModules((m) => m.map((x, i) => (i === idx ? { ...x, textContent: e.target.value } : x)))
                      }
                      rows={5}
                      className="border-white/10 bg-black/30 font-mono text-sm text-white"
                      placeholder="Plain text or HTML. Plain text becomes paragraphs automatically."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Video URL (optional)</Label>
                    <Input
                      value={mod.videoUrl}
                      onChange={(e) =>
                        setModules((m) => m.map((x, i) => (i === idx ? { ...x, videoUrl: e.target.value } : x)))
                      }
                      className="border-white/10 bg-black/30 text-white"
                      placeholder="YouTube, Vimeo, or direct .mp4 URL"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: '#ed9d24' }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Saving…' : 'Save course'}
            </button>
            <Link
              href="/admin/courses"
              className="inline-flex items-center justify-center rounded-lg border border-white/15 px-5 py-3 text-sm text-white/70 hover:bg-white/5"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
