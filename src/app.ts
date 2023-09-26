import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { knex } from './database'
import { transactionsRoutes } from './routes/transactions'

export const app = fastify()

app.register(cookie)

app.addHook('preHandler',async (request, reply) => {
  console.log(`[${request.method}] ${request.url}`)
})

app.register(transactionsRoutes, {
  prefix: 'transactions'
})

// GET, POST, PUT, PATCH, DELETE

app.get('/hello',async () => {
  const tables = await knex('sqlite_schema').select('*')

  return tables
})