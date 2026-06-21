import fastify from 'fastify'
import cookie from '@fastify/cookie'

import { transactionsRoutes } from './routes/transactions'

export const app = fastify()

app.register(cookie)

app.addHook('preHandler', async (request, response) => {
  console.log(`[${request.method}] ${request.url}`)
})

// App live
app.get('/', () => {
  console.log('App is live!')
})

// GET, POST, PUT, PATCH, DELETE
app.register(transactionsRoutes, {
  prefix: 'transactions',
})