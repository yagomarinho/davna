import { Handler } from '@davna/core'

interface Data {
  message: Message
}

interface Metadata {}

interface Env {}

export const orchestrateResponseHandler = Handler<Env, Data, Metadata>(
  request => env => {
    // O que vou precisar fazer aqui?
    // O orchestrador precisa ser responsável por orquestrar a resposta, e orquestrar significa
    // verificar todos os passos e ir fazendo passo a passo
    // Toda a lógica de receber a mensagem que se deseja fazer append e até o reply
    // Vai receber
  },
)
