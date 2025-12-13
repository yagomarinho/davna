/**
 * Agora vamos lá
 *
 * o que preciso realizar aqui?
 *
 * Separar quem é responsabilidade de quem para que eu possa focar em refatorar os serviços da forma correta
 *
 * # Responsabilidades do cliente
 * - O Client manda o áudio para o servidor que
 *
 * # Responsabilidades do Gateway + Monolith API
 * - Enviar o áudio para um storage temporário afim de que não se perca caso
 * - Valida se o usuário ainda tem consumo suficiente para aceitar o áudio
 *    - Caso não, então retornar uma mensagem de erro e finalizar o processo
 * - Indicar status de processando áudio
 * - Então processa o áudio no ffmpeg para que ele esta tratado corretamente
 *    - Caso dê erro no processamento, retornar uma mensagem de erro de processamento
 * - Enviar o áudio processado para o storage afim de
 */
