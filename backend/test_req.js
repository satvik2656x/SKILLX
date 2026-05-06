fetch('http://localhost:3001/api/auth/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'maiticmaitic@gmail.com' })
}).then(res => res.text()).then(console.log).catch(console.error);
