import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, RefreshCw, Search } from 'lucide-react';
import useAuth from '../context/useAuth';
import usePharmacy from '../context/usePharmacy';
import useCurrency from '../hooks/useCurrency';
import { createPharmacy, getAvailability } from '../services/pharmacyService';
import ProductImage from '../components/products/ProductImage';

export default function Pharmacies() {
  const { user } = useAuth();
  const { pharmacies, pharmacyId, reloadPharmacies } = usePharmacy();
  const { formatCurrency } = useCurrency();
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [search, setSearch] = useState('');
  const [data, setData] = useState({ articles: [], updatedAt: null });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await getAvailability(search);
        if (!cancelled) { setData(response.data); setError(''); setLoading(false); }
      } catch (err) { if (!cancelled) { setError(err.response?.data?.message || 'No se pudo consultar la red de farmacias.'); setLoading(false); } }
    };
    const debounce = setTimeout(load, 250);
    const interval = setInterval(() => { if (!document.hidden) load(); }, 30000);
    return () => { cancelled = true; clearTimeout(debounce); clearInterval(interval); };
  }, [search, refresh]);
  const addPharmacy = async event => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await createPharmacy(form); await reloadPharmacies();
      setForm({ name: '', address: '', phone: '' }); setRefresh(n => n + 1);
    } catch (err) { setError(err.response?.data?.message || 'No se pudo crear la farmacia.'); }
    finally { setSaving(false); }
  };
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="flex items-center gap-3 text-2xl font-bold"><Building2 className="text-emerald-600" />Red de farmacias</h1><p className="mt-2 text-sm text-slate-500">Consulta el mismo artículo por su código y verifica en qué farmacia está disponible.</p></div><button onClick={() => setRefresh(n => n + 1)} className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm"><RefreshCw size={16} />Actualizar</button></div>
    {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
    <div className="grid gap-3 md:grid-cols-3">{pharmacies.map(p => <div key={p.id} className={`rounded-xl border bg-white p-4 ${p.id === pharmacyId ? 'border-emerald-400' : 'border-slate-200'}`}><p className="font-semibold">{p.name}{p.id === pharmacyId && <span className="ml-2 text-xs text-emerald-600">Activa</span>}</p><p className="mt-1 text-xs text-slate-500">{p.address || 'Dirección no registrada'}</p><p className="mt-1 text-xs text-slate-500">{p.phone}</p></div>)}</div>
    {user?.role === 'admin' && <form onSubmit={addPharmacy} className="rounded-xl border bg-white p-5"><h2 className="mb-3 font-semibold">Agregar farmacia</h2><div className="grid gap-3 md:grid-cols-4"><input aria-label="Nombre de la nueva farmacia" required maxLength={120} placeholder="Nombre de farmacia" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-lg border p-2 text-sm" /><input aria-label="Dirección de la nueva farmacia" maxLength={300} placeholder="Dirección" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="rounded-lg border p-2 text-sm" /><input aria-label="Teléfono de la nueva farmacia" maxLength={40} placeholder="Teléfono" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-lg border p-2 text-sm" /><button disabled={saving} className="rounded-lg bg-emerald-600 p-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Guardando…' : 'Crear farmacia'}</button></div></form>}
    <div className="relative"><Search size={18} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Buscar disponibilidad por código o nombre" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código único o nombre del artículo…" className="w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm" /></div>
    <p className="text-xs text-slate-500">{data.updatedAt ? `Última consulta: ${new Date(data.updatedAt).toLocaleTimeString('es-DO')}. Actualización automática cada 30 segundos.` : 'Consultando disponibilidad…'}</p>
    {loading ? <p>Cargando artículos…</p> : !data.articles.length ? <div className="rounded-xl border bg-white p-8 text-center text-slate-500">No hay artículos que coincidan con la búsqueda.</div> : data.articles.map(article => <section key={article.code} className="overflow-hidden rounded-xl border bg-white"><div className="flex items-center gap-4 border-b p-5"><ProductImage imageUrl={article.imageUrl} name={article.name} /><div><h2 className="font-semibold">{article.name}</h2><p className="mt-1 font-mono text-xs text-slate-500">{article.code}</p></div>{user?.role === 'admin' && !article.pharmacies.some(p => p.id === pharmacyId) && <Link to={`/products/new?${new URLSearchParams({ code: article.code, name: article.name, category: article.category, imageUrl: article.imageUrl })}`} className="ml-auto text-sm font-semibold text-emerald-700">Agregar a mi farmacia</Link>}</div><div className="grid gap-4 p-5 md:grid-cols-3">{pharmacies.map(pharmacy => {
      const inventory = article.pharmacies.find(p => p.id === pharmacy.id);
      return <div key={pharmacy.id} className="rounded-lg bg-slate-50 p-4"><p className="text-sm font-semibold">{pharmacy.name}</p><p className={`mt-2 text-sm font-semibold ${inventory?.available ? 'text-emerald-700' : 'text-slate-500'}`}>{inventory?.available ? `${inventory.availableStock} unidades disponibles` : inventory ? 'Sin unidades disponibles' : 'Artículo no registrado'}</p>{inventory && <p className="mt-1 text-xs text-slate-500">{formatCurrency(inventory.price)} · Stock total: {inventory.stock}</p>}</div>;
    })}</div></section>)}
  </div>;
}
