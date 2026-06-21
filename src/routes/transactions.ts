import type { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {
    app.get(
        '/', 
        {
            preHandler: [checkSessionIdExists]
        }, 
        async (request) => {
            const { sessionId } = request.cookies

            const transactions = await knex('transactions')
                .where('session_id', sessionId)
                .select()

            return {
                transactions,
            }
        }
    )

    app.get(
        '/:id',
        {
            preHandler: [checkSessionIdExists]
        }, 
        async (request) => {
            const getTransactionParamsSchema = z.object({
                id: z.uuid()
            })

            const { id } = getTransactionParamsSchema.parse(request.params)

            const { sessionId } = request.cookies

            const transaction = await knex('transactions')
                .where({
                    session_id: sessionId,
                    id,
                })
                .first()

            return {
                transaction,
            }
        }
    )

    app.get(
        '/summary', 
        {
            preHandler: [checkSessionIdExists]
        }, 
        async (request) => {
            const { sessionId } = request.cookies

            const summary = await knex('transactions')
                .where('session_id', sessionId)
                .sum('amount', { as: 'amount' })
                .first()

            return { 
                summary,
            }
        }
    )

    app.post('/', async (request, response) => {
            // { title, amount, type: credit or debit }

            const createTransactionBodySchema = z.object({
                title: z.string(),
                amount: z.number(),
                type: z.enum(['credit', 'debit']),
            })

            const { title, amount, type } = createTransactionBodySchema.parse(request.body)

            let sessionId = request.cookies.sessionId

            if (!sessionId) {
                sessionId = randomUUID()

                response.cookie('sessionId', sessionId, {
                    path: '/',
                    maxAge: 60 * 60 * 2, // 2 hours
                })
            }

            await knex('transactions')
                .insert({
                    id: randomUUID(),
                    title,
                    amount: type === 'credit' ? amount : amount * -1,
                    session_id: sessionId,
                })

            // HTTP status for creation is 201 if successful
            return response.status(201).send()
        }
    )
}