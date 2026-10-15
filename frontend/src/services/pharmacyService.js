import api from './api';
export const getPharmacies = () => api.get('/pharmacies', { headers: { 'X-Pharmacy-Id': '1' } });
export const createPharmacy = data => api.post('/pharmacies', data);
export const getAvailability = search => api.get('/availability', { params: { search } });
export const uploadProductImage = file => api.post('/images', file, { headers: { 'Content-Type': file.type } });
export const authorizeCardPayment = data => api.post('/card-payments', data);
