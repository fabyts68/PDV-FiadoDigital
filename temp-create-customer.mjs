const loginRes = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' }),
});
if (!loginRes.ok) {
  console.error('login failed', await loginRes.text());
  process.exit(1);
}
const loginBody = await loginRes.json();
const accessToken = loginBody.data.accessToken;

const createRes = await fetch('http://localhost:3000/api/customers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    name: 'Cliente de Teste',
    phone: '11999999999',
    credit_limit_cents: 100000,
    payment_due_day: 10,
    is_active: true,
  }),
});
console.log('create status', createRes.status);
console.log(await createRes.text());

const listRes = await fetch('http://localhost:3000/api/customers?page=1&per_page=5', {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  },
});
console.log('list status', listRes.status);
console.log(await listRes.text());
