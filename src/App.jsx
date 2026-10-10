import { useEffect, useState } from 'react'
import { api } from './api'

const money = (n) => '₹' + Number(n).toFixed(2)

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '', address: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      onLogin(mode === 'login' ? await api.login(f) : await api.register(f))
    } catch (x) {
      setErr(x.message)
    }
  }

  return (
    <form className="card auth" onSubmit={submit}>
      <h2>{mode === 'login' ? 'Login' : 'Create account'}</h2>
      {mode === 'register' && (
        <>
          <input placeholder="Name" value={f.name} onChange={set('name')} required />
          <input placeholder="Phone" value={f.phone} onChange={set('phone')} />
          <input placeholder="Address" value={f.address} onChange={set('address')} />
        </>
      )}
      <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
      <input type="password" placeholder="Password (min 6)" minLength={6}
             value={f.password} onChange={set('password')} required />
      {err && <p className="err">{err}</p>}
      <button className="primary">{mode === 'login' ? 'Login' : 'Register'}</button>
      <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'New here? Create an account' : 'Have an account? Login'}
      </button>
    </form>
  )
}

function Restaurants({ onOpen }) {
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    api.restaurants(q).then(setList).catch((e) => setErr(e.message))
  }, [q])

  return (
    <>
      <input className="search" placeholder="Search restaurants…" value={q} onChange={(e) => setQ(e.target.value)} />
      {err && <p className="err">{err}</p>}
      <div className="grid">
        {list.map((r) => (
          <div key={r.id} className="card clickable" onClick={() => onOpen(r)}>
            <h3>{r.name}</h3>
            <p>{r.cuisine} · {r.address}</p>
            <span className="badge">★ {r.rating}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function Menu({ restaurant, user, cart, setCart, onBack, onPlaced }) {
  const [items, setItems] = useState([])
  const [address, setAddress] = useState(user.address || '')
  const [err, setErr] = useState('')

  useEffect(() => { api.menu(restaurant.id).then(setItems).catch((e) => setErr(e.message)) }, [restaurant.id])

  const change = (item, d) => {
    const qty = Math.max(0, (cart[item.id]?.qty || 0) + d)
    const next = { ...cart }
    if (qty === 0) delete next[item.id]
    else next[item.id] = { item, qty }
    setCart(next)
  }
  const lines = Object.values(cart)
  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0)

  const checkout = async () => {
    setErr('')
    try {
      await api.placeOrder({
        userId: user.id,
        restaurantId: restaurant.id,
        address,
        items: lines.map((l) => ({ menuItemId: l.item.id, quantity: l.qty })),
      })
      setCart({})
      onPlaced()
    } catch (x) {
      setErr(x.message)
    }
  }

  return (
    <>
      <button className="link" onClick={onBack}>← Back</button>
      <h2>{restaurant.name}</h2>
      <div className="split">
        <div>
          {items.map((m) => (
            <div key={m.id} className="card row">
              <div>
                <strong>{m.name}</strong>
                <p>{m.description}</p>
                <span>{money(m.price)}</span>
              </div>
              <div className="qty">
                <button onClick={() => change(m, -1)}>−</button>
                <span>{cart[m.id]?.qty || 0}</span>
                <button onClick={() => change(m, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div className="card cart">
          <h3>Your cart</h3>
          {lines.length === 0 && <p>Cart is empty</p>}
          {lines.map((l) => (
            <p key={l.item.id}>{l.qty} × {l.item.name} — {money(l.item.price * l.qty)}</p>
          ))}
          <hr />
          <strong>Total: {money(total)}</strong>
          <input placeholder="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} />
          {err && <p className="err">{err}</p>}
          <button className="primary" disabled={!lines.length || !address.trim()} onClick={checkout}>
            Place order
          </button>
        </div>
      </div>
    </>
  )
}

function Orders({ user }) {
  const [orders, setOrders] = useState([])
  const [err, setErr] = useState('')
  useEffect(() => { api.orders(user.id).then(setOrders).catch((e) => setErr(e.message)) }, [user.id])

  return (
    <>
      <h2>My orders</h2>
      {err && <p className="err">{err}</p>}
      {orders.length === 0 && <p>No orders yet.</p>}
      {orders.map((o) => (
        <div key={o.id} className="card">
          <div className="row">
            <strong>#{o.id} · {o.restaurant.name}</strong>
            <span className="badge">{o.status}</span>
          </div>
          {o.items.map((i) => (
            <p key={i.id}>{i.quantity} × {i.menuItem.name}</p>
          ))}
          <p>Total: {money(o.total)} · {new Date(o.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </>
  )
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'))
  const [view, setView] = useState('restaurants')
  const [restaurant, setRestaurant] = useState(null)
  const [cart, setCart] = useState({})

  const login = (u) => { localStorage.setItem('user', JSON.stringify(u)); setUser(u) }
  const logout = () => { localStorage.removeItem('user'); setUser(null); setCart({}); setView('restaurants') }
  const open = (r) => {
    if (restaurant?.id !== r.id) setCart({})
    setRestaurant(r)
    setView('menu')
  }

  return (
    <div className="app">
      <header>
        <h1 onClick={() => setView('restaurants')}>🍔 FoodOrder</h1>
        {user && (
          <nav>
            <button className="link" onClick={() => setView('restaurants')}>Restaurants</button>
            <button className="link" onClick={() => setView('orders')}>My orders</button>
            <span>Hi, {user.name}</span>
            <button className="link" onClick={logout}>Logout</button>
          </nav>
        )}
      </header>
      <main>
        {!user && <Auth onLogin={login} />}
        {user && view === 'restaurants' && <Restaurants onOpen={open} />}
        {user && view === 'menu' && restaurant && (
          <Menu restaurant={restaurant} user={user} cart={cart} setCart={setCart}
                onBack={() => setView('restaurants')} onPlaced={() => setView('orders')} />
        )}
        {user && view === 'orders' && <Orders user={user} />}
      </main>
    </div>
  )
}
