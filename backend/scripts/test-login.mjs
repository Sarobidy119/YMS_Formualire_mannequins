const response = await fetch('http://localhost:4000/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@yms.local', password: 'admin123' })
})

const payload = await response.text()
console.log('status', response.status)
console.log(payload)
