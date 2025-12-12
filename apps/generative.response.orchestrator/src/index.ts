/**
 *
 *
 * O que eu preciso fazer aqui? Preciso construir uma API que ao invés de trabalhar com rotas
 * POST /response
 * POST /translate
 * POST /synthesize
 *
 * Quero enviar a mensagem e ela dentro dela própria decidirá qual tipo de resposta enviar
 *
 * Uma coisa que eu gostei muito foi o método POST /message 202 - Accepted
 * Trabalhando com um webhook informando o pronto ou trabalhando com um socket streaming
 *
 * -----------------
 * Basicamente vou trabalhar com duas rotas
 * POST /orchestrate-response - 202 Accepted { response_id: string }
 * GET /response/:id - 200 { status: 'pending' | 'done' metadata: { message_id: string } }
 */
