import { Filter, QueryBuilder, Right, Service } from '@davna/core'
import { ClassroomFedRepository } from '../repositories'
import {
  Audio,
  AudioURI,
  Message,
  MessageURI,
  OccursIn,
  OccursInURI,
  Ownership,
  OwnershipURI,
  Representation,
  REPRESENTATION_TYPE,
  RepresentationURI,
  Source,
  SourceURI,
} from '../entities'

interface Data {
  classroom_id: string
  cursor_ref?: string
  batch_size?: number
}

export interface UnprocessedMessage {
  classroom_id: string
  message: Message
  audio: Audio
  messageOwnership: Ownership
  audioOwnership: Ownership
}

interface Response {
  next_cursor?: string
  unprocessed_messages: UnprocessedMessage[]
}

interface Env {
  repository: ClassroomFedRepository
}

export const fetchUnprocessedMessages = Service<Data, Env, Response>(
  ({ classroom_id, batch_size = 5, cursor_ref = '0' }) =>
    async ({ repository }) => {
      const { data: occursIn, next_cursor } = await repository.methods.query(
        QueryBuilder<OccursIn>()
          .orderBy([{ property: 'created_at', direction: 'desc' }])
          .filterBy('target_id', '==', classroom_id)
          .limit(batch_size)
          .cursor(cursor_ref)
          .build(),
        OccursInURI,
      )

      const messages_ids = occursIn.map(occurs => occurs.props.source_id)

      const { data: sources } = await repository.methods.query(
        QueryBuilder<Source>()
          .filterBy(
            Filter.and(
              Filter.where('target_id', 'in', messages_ids),
              Filter.where('source_type', '==', AudioURI),
            ),
          )
          .build(),
        SourceURI,
      )

      const audios_ids = sources.map(source => source.props.source_id)

      const { data: representations } = await repository.methods.query(
        QueryBuilder<Representation>()
          .orderBy([{ property: 'target_id', direction: 'asc' }])
          .filterBy(
            Filter.and(
              Filter.where('target_id', 'in', audios_ids),
              Filter.or(
                Filter.where('type', '==', REPRESENTATION_TYPE.TRANSCRIPTION),
                Filter.where('type', '==', REPRESENTATION_TYPE.TRANSLATION),
              ),
            ),
          )
          .build(),
        RepresentationURI,
      )

      const audio_to_message_map = new Map(
        sources.map(source => [source.props.source_id, source.props.target_id]),
      )

      const initMap = audios_ids.reduce(
        (acc, audio_id) => ((acc[audio_id] = 0), acc),
        {} as { [x: string]: number },
      )

      const representations_count = representations.reduce(
        (acc, rep) => (
          (acc[rep.props.target_id] = (acc[rep.props.target_id] ?? 0) + 1),
          acc
        ),
        initMap,
      )

      const unprocessed_audios_ids = Object.entries(representations_count)
        .filter(([, times]) => times < 2)
        .map(([audio_id]) => audio_id)

      const unprocessed_messages_ids = unprocessed_audios_ids.map(
        audio_id => audio_to_message_map.get(audio_id)!,
      )

      const { data: unprocessed_messages } = await repository.methods.query(
        QueryBuilder<Message>()
          .filterBy('id', 'in', unprocessed_messages_ids)
          .build(),
        MessageURI,
      )

      const messagesMap = new Map(
        unprocessed_messages.map(message => [message.meta.id, message]),
      )

      const { data: unprocessed_audios } = await repository.methods.query(
        QueryBuilder().filterBy('id', 'in', unprocessed_audios_ids).build(),
        AudioURI,
      )

      const aggregates: UnprocessedMessage[] = await Promise.all(
        unprocessed_audios.map(async audio => {
          const message_id = audio_to_message_map.get(audio.meta.id)!

          const message = messagesMap.get(message_id)!

          const [
            {
              data: [messageOwnership],
            },
            {
              data: [audioOwnership],
            },
          ] = await Promise.all([
            repository.methods.query(
              QueryBuilder<Ownership>()
                .filterBy(
                  Filter.and(
                    Filter.where('target_type', '==', MessageURI),
                    Filter.where('target_id', '==', message.meta.id),
                  ),
                )
                .build(),
              OwnershipURI,
            ),
            repository.methods.query(
              QueryBuilder<Ownership>()
                .filterBy(
                  Filter.and(
                    Filter.where('target_type', '==', AudioURI),
                    Filter.where('target_id', '==', audio.meta.id),
                  ),
                )
                .build(),
              OwnershipURI,
            ),
          ])

          return {
            classroom_id,
            message,
            audio,
            audioOwnership,
            messageOwnership,
          }
        }),
      )

      return Right({
        next_cursor,
        unprocessed_messages: aggregates,
      })
    },
)
