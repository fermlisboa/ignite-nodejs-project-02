import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { knex } from "../database"
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {

  app.addHook('preHandler',async (request, reply) => {
    console.log('prehandler transactions')
  })

  app.get('/', {
    preHandler: [checkSessionIdExists]
  }, async (request, reply) => {

    const { sessionId } = request.cookies

    const transactions = await knex('transactions').select().where('session_id', sessionId)
  
    return { transactions }
  })

  app.get('/:id', {
    preHandler: [checkSessionIdExists]
  }, async (request) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getTransactionParamsSchema.parse(request.params)

    const { sessionId } = request.cookies

    const transactions = await knex('transactions').select().where({id, session_id: sessionId}).first()
  
    return { transactions }
  })

  app.get('/summary', {
    preHandler: [checkSessionIdExists]
  }, async (request) => {
    const { sessionId } = request.cookies

    const summary = await knex('transactions').select().sum('amount', { as: 'amount' }).where('session_id', sessionId).first()
  
    return { summary }
  })
  
  app.post('/',async (request, reply) => {

    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24  // 1 Day
      })
    }

    const transaction = await knex('transactions').insert({
      id: randomUUID(),
      title: title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId
    }).returning('*')
  
    return reply.status(201).send(transaction)
  })

}