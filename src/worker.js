const encoder = new TextEncoder()

// In-memory stores for demo purposes (resets on worker restart)
const USERS = []
const PASSWORDS = new Map()
let nextUserId = 1
const FAVORITES = {} // clientId -> [{ id, productId }]
let nextFavoriteId = 1

const PRODUCTS = [
  { id: 1, title: 'Camiseta Estilosa', price: 49.9, image: 'https://via.placeholder.com/300', rating: 4.5 },
  { id: 2, title: 'Tênis Confortável', price: 129.9, image: 'https://via.placeholder.com/300', rating: 4.7 },
  { id: 3, title: 'Mochila Resistente', price: 89.0, image: 'https://via.placeholder.com/300', rating: 4.3 }
]

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

async function readJson(request) {
  try {
    return await request.json()
  } catch (e) {
    return null
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname

    // AUTH: register & login
    if (path === '/auth/register' && request.method === 'POST') {
      const body = await readJson(request)
      if (!body || !body.email || !body.password || !body.name) {
        return jsonResponse({ message: 'Dados inválidos' }, 400)
      }
      if (USERS.find(u => u.email === body.email)) {
        return jsonResponse({ message: 'Email já cadastrado' }, 409)
      }
      const user = { id: nextUserId++, name: body.name, email: body.email }
      USERS.push(user)
      PASSWORDS.set(user.email, body.password)
      FAVORITES[user.id] = []
      return jsonResponse({ token: 'demo-token', client: user }, 201)
    }

    if (path === '/auth/login' && request.method === 'POST') {
      const body = await readJson(request)
      if (!body || !body.email || !body.password) return jsonResponse({ message: 'Credenciais inválidas' }, 400)
      const user = USERS.find(u => u.email === body.email)
      if (!user || PASSWORDS.get(body.email) !== body.password) return jsonResponse({ message: 'Email ou senha incorretos' }, 401)
      return jsonResponse({ token: 'demo-token', client: user })
    }

    // PRODUCTS
    if (path === '/products' && request.method === 'GET') {
      return jsonResponse(PRODUCTS)
    }

    // CLIENTS
    if (path === '/clients' && request.method === 'GET') {
      return jsonResponse(USERS)
    }

    if (path === '/clients' && request.method === 'POST') {
      const body = await readJson(request)
      if (!body || !body.email || !body.name) return jsonResponse({ message: 'Dados inválidos' }, 400)
      if (USERS.find(u => u.email === body.email)) return jsonResponse({ message: 'Email já cadastrado' }, 409)
      const user = { id: nextUserId++, name: body.name, email: body.email }
      USERS.push(user)
      PASSWORDS.set(user.email, body.password || 'demo')
      FAVORITES[user.id] = []
      return jsonResponse(user, 201)
    }

    // FAVORITES routes: /clients/:id/favorites
    const favMatch = path.match(/^\/clients\/(\d+)\/favorites(?:\/(\d+))?$/)
    if (favMatch) {
      const clientId = Number(favMatch[1])
      const favId = favMatch[2] ? Number(favMatch[2]) : null
      if (!USERS.find(u => u.id === clientId)) return jsonResponse({ message: 'Cliente não encontrado' }, 404)

      if (request.method === 'GET') {
        return jsonResponse(FAVORITES[clientId] || [])
      }

      if (request.method === 'POST') {
        const body = await readJson(request)
        const productId = body?.productId
        if (!productId) return jsonResponse({ message: 'productId obrigatório' }, 400)
        const favorite = { id: nextFavoriteId++, productId }
        FAVORITES[clientId].push(favorite)
        return jsonResponse(favorite, 201)
      }

      if (request.method === 'DELETE' && favId) {
        const list = FAVORITES[clientId]
        const idx = list.findIndex(f => f.id === favId)
        if (idx === -1) return jsonResponse({}, 204)
        list.splice(idx, 1)
        return jsonResponse({}, 204)
      }
    }

    // Default: serve static assets from the assets binding
    try {
      return await env.ASSETS.fetch(request)
    } catch (err) {
      return new Response('Not found', { status: 404 })
    }
  }
}
