/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Filter, Handler, QueryBuilder, Response } from '@davna/core'
import { ClassroomFedRepository } from '../repositories'
import {
  AudioURI,
  Message,
  MessageURI,
  OccursIn,
  OccursInURI,
  Representation,
  REPRESENTATION_TYPE,
  RepresentationURI,
  Source,
  SourceURI,
} from '../entities'

interface Data {
  classroom_id: string
}

interface Metadata {}

interface Env {
  repository: ClassroomFedRepository
}

export const fetchUnprocessedMessages = Handler<Env, Data, Metadata>(
  request =>
    async ({ repository }) => {
      const { classroom_id } = request.data

      const occursIn = await repository.methods.query(
        QueryBuilder<OccursIn>()
          .filterBy('target_id', '==', classroom_id)
          .build(),
        OccursInURI,
      )

      const messages_ids = occursIn.map(occurs => occurs.props.source_id)

      const sources = await repository.methods.query(
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

      const representations = await repository.methods.query(
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

      const unprocessed_messages_ids = Object.entries(representations_count)
        .filter(([, times]) => times < 2)
        .map(([audio_id]) => audio_to_message_map.get(audio_id)!)

      const unprocessed_messages = await repository.methods.query(
        QueryBuilder<Message>()
          .filterBy('id', 'in', unprocessed_messages_ids)
          .build(),
        MessageURI,
      )

      return Response.data({
        unprocessed_messages,
      })
    },
)
