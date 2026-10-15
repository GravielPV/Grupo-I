import { useContext } from 'react';
import PharmacyContext from './PharmacyContext';
export default function usePharmacy() { return useContext(PharmacyContext); }
