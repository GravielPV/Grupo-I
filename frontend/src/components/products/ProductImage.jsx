import { Package } from 'lucide-react';
import api from '../../services/api';

export default function ProductImage({ imageUrl, name, className = 'h-14 w-14' }) {
  const src = /^\/api\/images\/[a-f0-9-]{36}$/.test(imageUrl ?? '') ? new URL(imageUrl, new URL(api.defaults.baseURL, window.location.origin)).href : '';
  return <div className={`relative shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${className}`}>
    <div className="flex h-full items-center justify-center text-slate-300"><Package size={24} /></div>
    {src && <img src={src} alt={name} loading="lazy" className="absolute inset-0 h-full w-full bg-white object-contain" onError={e => { e.currentTarget.hidden = true; }} />}
  </div>;
}
