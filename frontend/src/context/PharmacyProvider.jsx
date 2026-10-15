import { useCallback, useEffect, useState } from 'react';
import PharmacyContext from './PharmacyContext';
import useAuth from './useAuth';
import SettingsProvider from './SettingsProvider';
import { getPharmacies } from '../services/pharmacyService';

export default function PharmacyProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [pharmacies, setPharmacies] = useState([]);
  const [pharmacyId, setPharmacyId] = useState(() => Number(localStorage.getItem('pharmacy_active')) || 1);
  const [error, setError] = useState('');
  const reloadPharmacies = useCallback(() => getPharmacies().then(({ data }) => {
      setPharmacies(data); setError('');
      const saved = Number(localStorage.getItem('pharmacy_active')) || 1;
      const next = data.some(p => p.id === saved) ? saved : data[0]?.id ?? 1;
      localStorage.setItem('pharmacy_active', String(next)); setPharmacyId(next);
  }).catch(() => { setError('No se pudo cargar la lista de farmacias.'); }), []);
  useEffect(() => { if (isAuthenticated) reloadPharmacies(); }, [isAuthenticated, reloadPharmacies]);
  const selectPharmacy = value => {
    const next = Number(value);
    if (!pharmacies.some(p => p.id === next)) return;
    localStorage.setItem('pharmacy_active', String(next)); setPharmacyId(next);
  };
  return <PharmacyContext.Provider value={{ pharmacies, pharmacyId, pharmacy: pharmacies.find(p => p.id === pharmacyId), selectPharmacy, reloadPharmacies, error }}>
    <SettingsProvider key={pharmacyId}>{children}</SettingsProvider>
  </PharmacyContext.Provider>;
}
