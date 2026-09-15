"use client";

import { useEffect, useState } from "react";
import { getBackendUrl } from "@/lib/backend-url";
import { Upload, X, Edit, Trash2, Plus, Check, Loader2 } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Signatory = {
  id: string;
  schoolId: string;
  name: string;
  title?: string | null;
  signatureUrl?: string | null;
  phase?: string | null;
  active: boolean;
};

const PHASES: { key: string; label: string }[] = [
  { key: "EARLY_YEARS", label: "Early Years" },
  { key: "PRIMARY", label: "Primary" },
  { key: "SECONDARY", label: "Secondary" },
];

export default function SignatoriesClient({ noCard }: { noCard?: boolean } = {}) {
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Signatory | null>(null);
  const [form, setForm] = useState({ name: "", title: "", phase: "", active: true, signatureUrl: "" });
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchList(); }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/admin/signatories`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const d = await res.json();
      setSignatories(d.signatories || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const backendUrl = getBackendUrl();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'signatory');
      const res = await fetch(`${backendUrl}/api/admin/settings/upload`, { method: 'POST', body: formData, credentials: 'include' });
      const data = await res.json();
      return data.url as string | null;
    } catch (e) { console.error(e); return null; }
    finally { setUploading(false); }
  }

  function openAdd(phaseKey?: string) {
    setEditing(null);
    setForm({ name: "", title: "", phase: phaseKey || "", active: true, signatureUrl: "" });
    setFilePreview(null);
    setModalOpen(true);
  }

  function openEdit(s: Signatory) {
    setEditing(s);
    setForm({ name: s.name || "", title: s.title || "", phase: s.phase || "", active: !!s.active, signatureUrl: s.signatureUrl || "" });
    setFilePreview(s.signatureUrl || null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return alert('Please enter a name');
    setSaving(true);
    setSaved(false);
    try {
      let signatureUrl = form.signatureUrl || null;
      const backendUrl = getBackendUrl();
      if (editing) {
        const res = await fetch(`${backendUrl}/api/admin/signatories/${editing.id}`, {
          method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, title: form.title, phase: form.phase || null, signatureUrl, active: form.active }),
        });
        if (!res.ok) throw new Error('Update failed');
      } else {
        const res = await fetch(`${backendUrl}/api/admin/signatories`, {
          method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, title: form.title, phase: form.phase || null, signatureUrl, active: form.active }),
        });
        if (!res.ok) throw new Error('Create failed');
      }

      await fetchList();
      setSaving(false);
      setSaved(true);
      // show saved check briefly then close modal
      setTimeout(() => {
        setModalOpen(false);
        setSaved(false);
      }, 800);
    } catch (err) {
      console.error(err);
      alert('Save failed');
      setSaving(false);
      setSaved(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const url = await uploadFile(file);
    if (url) {
      setForm((f) => ({ ...f, signatureUrl: url }));
      setFilePreview(url);
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Deactivate this signatory?')) return;
    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/admin/signatories/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchList();
    } catch (err) { console.error(err); alert('Failed'); }
  }

  async function handleActivate(s: Signatory) {
    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/admin/signatories/${s.id}`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true }),
      });
      if (!res.ok) throw new Error('Activate failed');
      await fetchList();
    } catch (err) { console.error(err); alert('Failed'); }
  }

  const content = (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {PHASES.map((phase) => {
          const s = signatories.find((x) => x.phase === phase.key);
          const configured = !!s && s.active;
          return (
            <div key={phase.key} className="rounded-xl border border-border bg-background p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">{phase.label}</div>
                  <div className="mt-1">
                    {configured ? <Badge variant="success">Configured</Badge> : <Badge variant="outline">Not configured</Badge>}
                  </div>
                </div>
                <div className="text-sm text-muted">{configured ? '' : ''}</div>
              </div>

              <div className="mt-4 flex-1">
                {configured && s ? (
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-40 flex-shrink-0 overflow-hidden rounded bg-neutral-50 flex items-center justify-center">
                      {s.signatureUrl ? <img src={s.signatureUrl} alt="signature" className="object-contain max-h-16" /> : <div className="text-xs text-muted">No signature</div>}
                    </div>
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-sm text-muted mt-1">{s.title}</div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted">
                    No report signatory configured for {phase.label}.
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                {configured && s ? (
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" onClick={() => openEdit(s)}><Edit className="h-4 w-4"/> Edit</Button>
                    <Button type="button" variant="outline" onClick={() => handleDeactivate(s.id)}><Trash2 className="h-4 w-4"/> Deactivate</Button>
                  </div>
                ) : (
                  <div />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <style>{`@keyframes signatory_modal_enter { from { transform: translateY(12px) scale(.995); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }`}</style>
          <div className="w-full max-w-md overflow-hidden rounded-md border border-border bg-surface shadow-[0_16px_50px_rgba(10,102,194,0.16)]" style={{ animation: `signatory_modal_enter 240ms cubic-bezier(.2,.9,.2,1)` }}>
            <div className="border-b border-border px-6 py-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{editing ? 'Edit Report Signatory' : 'Add Report Signatory'}</h3>
                <p className="text-sm text-muted mt-1">Choose the academic phase and upload the signature image.</p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setModalOpen(false)}
                disabled={saving}
                className={`rounded-lg p-1 text-muted ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface'}`}
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Academic Phase</span>
                <select value={form.phase} onChange={(e) => setForm((f) => ({ ...f, phase: e.target.value }))} className="w-full rounded border border-border px-3 py-2 bg-background">
                  <option value="">Select phase</option>
                  {PHASES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Signatory Name</span>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded border border-border px-3 py-2 bg-background" />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Designation</span>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded border border-border px-3 py-2 bg-background" />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Signature</span>
                <div className="flex items-start gap-3">
                  <label className="flex items-center gap-2 p-2 border-2 border-dashed border-border rounded cursor-pointer bg-background">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Upload signature</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  <div className="h-20 w-40 overflow-hidden rounded bg-neutral-50 flex items-center justify-center">
                    {filePreview ? <img src={filePreview} alt="preview" className="object-contain max-h-16" /> : <div className="text-sm text-muted">No signature</div>}
                  </div>
                </div>
              </label>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                  <span className="text-sm text-muted">Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={`rounded border border-border px-4 py-2 text-sm ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={saving || saved}
                >
                  Cancel
                </button>
                <Button type="button" onClick={handleSave} variant="primary" disabled={saving || uploading || saved}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : saved ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    (editing ? 'Save changes' : 'Save Signatory')
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  if (noCard)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button type="button" variant="primary" onClick={() => openAdd()}>
            <Plus className="h-4 w-4" />
            Add Signatory
          </Button>
        </div>
        {content}
      </div>
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Report Signatories</CardTitle>
            <p className="text-sm text-muted">These signatures appear on student reports for each academic phase.</p>
          </div>
          <div>
            <Button type="button" variant="primary" onClick={() => openAdd() }>
              <Plus className="h-4 w-4" />
              Add Signatory
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
