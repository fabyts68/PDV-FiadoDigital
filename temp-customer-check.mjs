const loginRes = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' }),
});
console.log('login status', loginRes.status);
const loginBody = await loginRes.text();
console.log('login body', loginBody);
if (!loginRes.ok) process.exit(1);
const accessToken = JSON.parse(loginBody).data.accessToken;
const response = await fetch('http://localhost:3000/api/customers?page=1&per_page=5', {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  },
});
console.log('customers status', response.status);
console.log(await response.text());
