const axios = require('axios');

async function run() {
  const api = axios.create({ baseURL: 'http://localhost:3333', validateStatus: () => true });
  
  // 1. Register & Login
  const email = `test_${Date.now()}@test.com`;
  await api.post('/auth/register', { email, password: 'password123' });
  const login = await api.post('/auth/login', { email, password: 'password123' });
  const token = login.data.accessToken;
  const headers = { Authorization: `Bearer ${token}` };

  const testSlug = `conflict-slug-${Date.now()}`;

  // 2. Draft 1
  const draft1 = await api.post('/api/organizer/concerts', {}, { headers });
  const id1 = draft1.data.event_id;
  await api.put(`/api/organizer/concerts/${id1}/step/1`, { name: 'C1', category: 'Music', address_type: 'OFFLINE', venue_name: 'V1', province: 'P1', organizer_name: 'O1' }, { headers });
  await api.put(`/api/organizer/concerts/${id1}/step/2`, { start_time: '2027-12-01T18:00:00Z', ticket_types: [{ name: 'GA', price: 0, is_free: true, total_quantity: 10 }] }, { headers });
  await api.put(`/api/organizer/concerts/${id1}/step/3`, { slug: testSlug, privacy: 'PUBLIC' }, { headers });

  // 3. Draft 2
  const draft2 = await api.post('/api/organizer/concerts', {}, { headers });
  const id2 = draft2.data.event_id;
  await api.put(`/api/organizer/concerts/${id2}/step/1`, { name: 'C2', category: 'Music', address_type: 'OFFLINE', venue_name: 'V2', province: 'P2', organizer_name: 'O2' }, { headers });
  await api.put(`/api/organizer/concerts/${id2}/step/2`, { start_time: '2027-12-01T18:00:00Z', ticket_types: [{ name: 'GA', price: 0, is_free: true, total_quantity: 10 }] }, { headers });
  
  // Thử trùng slug
  const res = await api.put(`/api/organizer/concerts/${id2}/step/3`, { slug: testSlug, privacy: 'PUBLIC' }, { headers });
  
  console.log('Status:', res.status);
  console.log('Data:', res.data);
}

run();
