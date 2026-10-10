async function req(path, opts = {}) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })

  if (!res.ok) {
    let msg = res.statusText
    try {
      const body = await res.json()
      msg = body.message || body.error || msg
    } catch { /* ignore */ }
    throw new Error(msg)
  }
  return res.json()
}

const post = (path, body) => req(path, { method: 'POST', body: JSON.stringify(body) })

export const api = {
  register: (b) => post('/auth/register', b),
  login: (b) => post('/auth/login', b),
  restaurants: (q = '') => req('/restaurants' + (q ? `?q=${encodeURIComponent(q)}` : '')),
  menu: (id) => req(`/restaurants/${id}/menu`),
  placeOrder: (b) => post('/orders', b),
  orders: (userId) => req(`/orders?userId=${userId}`),
}

