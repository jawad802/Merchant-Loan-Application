import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Pencil, Plus, Power, Search, Trash2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  createLeadSource,
  deleteLeadSource,
  getLeadSourceById,
  getLeadSources,
  updateLeadSource,
} from '@/services/leadSourceService';

const PROVIDERS = ['unbounce', 'instapage'];

// Webhook paths come back relative (e.g. /api/webhooks/...), so prefix the API host.
const API_ORIGIN = (() => {
  try {
    return new URL(import.meta.env.VITE_API_BASE_URL).origin;
  } catch {
    return 'https://dev-api.boltfg.com';
  }
})();

const selectClass =
  'h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

function errorMessage(err, fallback) {
  if (err?.response?.status === 403) return "You don't have permission to manage lead sources.";
  return err?.response?.data?.message || fallback;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function mappingsToRows(fieldMapping) {
  const entries = Object.entries(fieldMapping ?? {});
  return entries.length ? entries.map(([from, to]) => ({ from, to })) : [{ from: '', to: '' }];
}

function rowsToMapping(rows) {
  return Object.fromEntries(
    rows.filter((m) => m.from.trim() && m.to.trim()).map((m) => [m.from.trim(), m.to.trim()])
  );
}

function StatCard({ label, value, note }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function ProviderBadge({ provider }) {
  return (
    <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
      {provider}
    </span>
  );
}

function DeliveryStatus({ lastDelivery }) {
  const status = lastDelivery?.status;
  if (!status) return <span className="text-xs text-muted-foreground">No deliveries yet</span>;
  const ok = status === 'success' || status === 'ok';
  return (
    <span className={`text-xs font-medium ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
      {status}
      {lastDelivery.errorCode ? ` · ${lastDelivery.errorCode}` : ''}
    </span>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; the text is still selectable */
    }
  };
  return (
    <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copy webhook URL">
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

function MappingEditor({ rows, setRows }) {
  const update = (i, key, value) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Field mapping</p>
      <p className="text-xs text-muted-foreground">Map form field names (left) to portal fields (right).</p>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            placeholder="Form field, e.g. Legal Business Name"
            value={row.from}
            onChange={(e) => update(i, 'from', e.target.value)}
          />
          <span className="text-muted-foreground">→</span>
          <Input
            placeholder="Portal field, e.g. businessName"
            value={row.to}
            onChange={(e) => update(i, 'to', e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove mapping"
            disabled={rows.length === 1}
            onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setRows((rs) => [...rs, { from: '', to: '' }])}
      >
        <Plus className="mr-1 h-4 w-4" />
        Add mapping
      </Button>
    </div>
  );
}

export default function LeadSources() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('');
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSources(await getLeadSources({ provider }));
    } catch (err) {
      setError(errorMessage(err, 'Could not load lead sources.'));
    } finally {
      setLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sources;
    return sources.filter((s) =>
      [s.name, s.campaign, s.provider].some((v) => v?.toLowerCase().includes(q))
    );
  }, [sources, query]);

  const activeCount = sources.filter((s) => s.isActive).length;
  const failedCount = sources.filter((s) => s.lastDelivery?.status === 'failed').length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lead Sources</h1>
          <p className="text-sm text-muted-foreground">
            Landing pages and forms that send leads into the portal.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="mr-1 h-4 w-4" />
          New lead source
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total sources" value={sources.length} note="Not deleted" />
        <StatCard label="Active" value={activeCount} note="Accepting leads" />
        <StatCard label="Last delivery failed" value={failedCount} note="Check these first" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, campaign or provider…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className={selectClass} value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="">All providers</option>
          {PROVIDERS.map((p) => (
            <option key={p} value={p} className="capitalize">
              {p}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading lead sources…</p>
      ) : visible.length === 0 && !error ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {query || provider ? 'No lead sources match your filters.' : 'No lead sources yet.'}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((s) => (
            <button key={s._id} type="button" onClick={() => setSelectedId(s._id)} className="text-left">
              <Card className="h-full shadow-sm transition-colors hover:border-blue-500/50">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold leading-tight">{s.name}</p>
                    <ProviderBadge provider={s.provider} />
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Campaign</dt>
                    <dd>{s.campaign || '—'}</dd>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      <span className={s.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                        {s.isActive ? 'Active' : 'Paused'}
                      </span>
                    </dd>
                    <dt className="text-muted-foreground">Last delivery</dt>
                    <dd>
                      <DeliveryStatus lastDelivery={s.lastDelivery} />
                    </dd>
                    <dt className="text-muted-foreground">Created</dt>
                    <dd>{formatDate(s.createdAt)}</dd>
                  </dl>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      <CreateLeadSourceDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />

      <LeadSourceDialog
        sourceId={selectedId}
        open={Boolean(selectedId)}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onChanged={load}
      />
    </div>
  );
}

function CreateLeadSourceDialog({ open, onOpenChange, onCreated }) {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('unbounce');
  const [landingPageUrl, setLandingPageUrl] = useState('');
  const [campaign, setCampaign] = useState('');
  const [rows, setRows] = useState([{ from: '', to: '' }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setName('');
      setProvider('unbounce');
      setLandingPageUrl('');
      setCampaign('');
      setRows([{ from: '', to: '' }]);
      setError('');
      setResult(null);
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await createLeadSource({
        name: name.trim(),
        provider,
        landingPageUrl: landingPageUrl.trim(),
        campaign: campaign.trim(),
        fieldMapping: rowsToMapping(rows),
      });
      setResult(res);
      onCreated();
    } catch (err) {
      setError(errorMessage(err, 'Could not create lead source.'));
    } finally {
      setBusy(false);
    }
  }

  const webhookUrl = result ? `${API_ORIGIN}${result.data.webhookPath}` : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{result ? 'Lead source created' : 'New lead source'}</DialogTitle>
          <DialogDescription>
            {result
              ? 'Copy the webhook URL now. The token will not be shown again.'
              : 'Connect a landing page to send leads into the portal.'}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
              {result.message}
            </div>
            <label htmlFor='webhook-url' className="block text-sm font-medium">
              Webhook URL
              <div className="mt-1 flex gap-2">
                <Input readOnly value={webhookUrl} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
                <CopyButton text={webhookUrl} />
              </div>
            </label>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium sm:col-span-2">
                Name
                <Input className="mt-1" required value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="block text-sm font-medium">
                Provider
                <select
                  className={`mt-1 w-full ${selectClass}`}
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                >
                  {PROVIDERS.map((p) => (
                    <option key={p} value={p} className="capitalize">
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Campaign
                <Input className="mt-1" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
              </label>
              <label className="block text-sm font-medium sm:col-span-2">
                Landing page URL
                <Input
                  className="mt-1"
                  type="url"
                  placeholder="https://"
                  value={landingPageUrl}
                  onChange={(e) => setLandingPageUrl(e.target.value)}
                />
              </label>
            </div>

            <MappingEditor rows={rows} setRows={setRows} />

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy || !name.trim()}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {busy ? 'Creating…' : 'Create lead source'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LeadSourceDialog({ sourceId, open, onOpenChange, onChanged }) {
  const [source, setSource] = useState(null);
  const [editing, setEditing] = useState(false);
  const [campaign, setCampaign] = useState('');
  const [rows, setRows] = useState([{ from: '', to: '' }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const applySource = (s) => {
    setSource(s);
    setCampaign(s.campaign ?? '');
    setRows(mappingsToRows(s.fieldMapping));
  };

  useEffect(() => {
    if (!open || !sourceId) return;
    setSource(null);
    setEditing(false);
    setError('');
    getLeadSourceById(sourceId)
      .then(applySource)
      .catch((err) => setError(errorMessage(err, 'Could not load this lead source.')));
  }, [open, sourceId]);

  async function handleSave(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const updated = await updateLeadSource(sourceId, {
        campaign: campaign.trim(),
        fieldMapping: rowsToMapping(rows),
      });
      applySource(updated);
      setEditing(false);
      onChanged?.();
    } catch (err) {
      setError(errorMessage(err, 'Could not save changes.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleActive() {
    setBusy(true);
    setError('');
    try {
      const updated = await updateLeadSource(sourceId, { isActive: !source.isActive });
      applySource(updated);
      onChanged?.();
    } catch (err) {
      setError(errorMessage(err, 'Could not change status.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${source.name}"? It will be removed from this list.`)) return;
    setBusy(true);
    setError('');
    try {
      await deleteLeadSource(sourceId);
      onChanged?.();
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err, 'Could not delete lead source.'));
    } finally {
      setBusy(false);
    }
  }

  const mappingEntries = Object.entries(source?.fieldMapping ?? {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{source?.name ?? 'Lead source'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Edit the campaign and field mapping.' : 'Details for this landing page connection.'}
          </DialogDescription>
        </DialogHeader>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!source && !error && <p className="text-sm text-muted-foreground">Loading…</p>}

        {source && editing && (
          <form onSubmit={handleSave} className="space-y-5">
            <label className="block text-sm font-medium">
              Campaign
              <Input className="mt-1" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
            </label>
            <MappingEditor rows={rows} setRows={setRows} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy} className="bg-blue-600 text-white hover:bg-blue-700">
                {busy ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {source && !editing && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Provider</dt>
              <dd><ProviderBadge provider={source.provider} /></dd>
              <dt className="text-muted-foreground">Campaign</dt>
              <dd>{source.campaign || '—'}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>{source.isActive ? 'Active' : 'Paused'}</dd>
              <dt className="text-muted-foreground">Last delivery</dt>
              <dd><DeliveryStatus lastDelivery={source.lastDelivery} /></dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDate(source.createdAt)}</dd>
              <dt className="text-muted-foreground">Landing page</dt>
              <dd>
                {source.landingPageUrl ? (
                  <a
                    href={source.landingPageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </dl>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Field mapping</p>
              {mappingEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mappings set.</p>
              ) : (
                <ul className="divide-y rounded-md border text-sm">
                  {mappingEntries.map(([from, to]) => (
                    <li key={from} className="flex justify-between gap-3 px-3 py-2">
                      <span>{from}</span>
                      <span className="font-mono text-muted-foreground">{to}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              The webhook URL is only shown when a lead source is created.
            </p>
          </div>
        )}

        {source && !editing && (
          <DialogFooter className="sm:justify-between">
            <Button variant="destructive" disabled={busy} onClick={handleDelete}>
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" disabled={busy} onClick={handleToggleActive}>
                <Power className="mr-1 h-4 w-4" />
                {source.isActive ? 'Pause' : 'Activate'}
              </Button>
              <Button variant="outline" disabled={busy} onClick={() => setEditing(true)}>
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </div>
          </DialogFooter>
        )}

        {!editing && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

