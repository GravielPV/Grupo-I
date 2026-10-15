import { useState } from 'react';
import { CheckCircle2, CreditCard, Loader2, Wifi, XCircle } from 'lucide-react';
import { authorizeCardPayment } from '../../services/pharmacyService';
import useCurrency from '../../hooks/useCurrency';
import Modal from '../common/Modal';

export default function CardTerminal({ items, total, onClose, onConfirm }) {
  const { formatCurrency } = useCurrency();
  const [testCard, setTestCard] = useState('approved');
  const [step, setStep] = useState('ready');
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const busy = step === 'processing' || step === 'saving';
  const authorize = async () => {
    setStep('processing'); setError('');
    try {
      const response = await authorizeCardPayment({ testCard, items: items.map(i => ({ product: i.product._id, quantity: i.quantity })) });
      setPayment(response.data); setStep('approved');
    } catch (err) { setError(err.response?.data?.message || 'No se pudo conectar con el terminal. Intenta de nuevo.'); setStep('declined'); }
  };
  const finalize = async () => {
    setStep('saving');
    const success = await onConfirm(payment.id);
    if (!success) { setStep('declined'); setPayment(null); setError('La venta no se pudo registrar. Revisa la caja y el inventario, y vuelve a autorizar. No se realizó ningún cobro real.'); }
  };
  return <Modal isOpen onClose={() => { if (!busy) onClose(); }} title="Terminal de tarjeta · Demostración" size="sm">
    <div role="status" aria-live="polite" className="rounded-2xl bg-slate-900 p-6 text-center text-white">
      <div className="mb-5 flex items-center justify-between text-xs text-emerald-300"><span>TU PHARMACY · DEMO</span><Wifi size={18} /></div>
      <p className="text-xs uppercase tracking-widest text-slate-400">Total a pagar</p><p className="my-3 text-3xl font-bold">{formatCurrency(total)}</p>
      {busy ? <><Loader2 className="mx-auto my-5 animate-spin text-emerald-300" size={40} /><p>{step === 'processing' ? 'Conectando con el emisor simulado…' : 'Registrando venta…'}</p><p className="mt-2 text-xs text-slate-400">No retires la tarjeta de demostración</p></> : step === 'approved' ? <><CheckCircle2 className="mx-auto my-5 text-emerald-300" size={44} /><p className="font-semibold text-emerald-300">PAGO APROBADO · SIMULADO</p><p className="mt-3 text-xs">{payment.brand} · •••• {payment.last4}</p><p className="mt-2 font-mono text-xs">Autorización: {payment.authorizationCode}</p><p className="mt-2 break-all font-mono text-[10px] text-slate-400">{payment.reference}</p></> : <><CreditCard className="mx-auto my-5 text-slate-300" size={44} /><p>{step === 'declined' ? 'Operación no completada' : 'Acerca o inserta la tarjeta de prueba'}</p></>}
    </div>
    <p className="my-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Simulación educativa. No realiza cargos ni se conecta con un banco. Utiliza solo las tarjetas de prueba disponibles.</p>
    {!busy && step !== 'approved' && <><label htmlFor="demo-card" className="mb-2 block text-sm font-medium">Tarjeta de prueba</label><select id="demo-card" value={testCard} onChange={e => setTestCard(e.target.value)} className="w-full rounded-lg border p-3 text-sm"><option value="approved">Visa demo •••• 4242 — Aprobación</option><option value="declined">Visa demo •••• 0002 — Rechazo</option><option value="insufficient">Visa demo •••• 9995 — Fondos insuficientes</option></select><p className="mt-2 text-xs text-slate-500">Cliente: CLIENTE DEMO · Vence: 12/30</p></>}
    {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><XCircle size={18} className="shrink-0" />{error}</p>}
    <button disabled={busy} onClick={step === 'approved' ? finalize : authorize} className="mt-5 w-full rounded-xl bg-emerald-600 p-3 font-semibold text-white disabled:opacity-50">{busy ? 'Procesando…' : step === 'approved' ? 'Registrar venta aprobada' : 'Simular lectura y autorizar'}</button>
    {!busy && <button onClick={onClose} className="mt-3 w-full p-2 text-sm text-slate-500">{step === 'approved' ? 'Cancelar y volver al carrito' : 'Volver al carrito'}</button>}
  </Modal>;
}
