/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Handler, isLeft, QueryBuilder, Response } from '@davna/core'
import { ClassroomFedRepository } from '../../repositories'
import {
  Audio,
  Message,
  MessageURI,
  OccursInURI,
  Representation,
  RepresentationURI,
  Source,
  SourceURI,
  Text,
} from '../../entities'
import { ensureClassroomParticipation } from '../../services'

interface Data {
  participant_id: string
  classroom_id: string
  batch_size?: number
  cursor_ref?: string
}

interface Env {
  repository: ClassroomFedRepository
}

export const fetchClassroomHistoryHandler = Handler<Env, Data>(
  ({
    data: { classroom_id, participant_id, batch_size = 10, cursor_ref = '0' },
  }) =>
    async ({ repository }) => {
      const ensureParticipationResult = await ensureClassroomParticipation({
        classroom_id,
        participant_id,
      })({ repository })

      if (isLeft(ensureParticipationResult))
        return Response({
          metadata: { headers: { status: 401 } },
          data: { message: ensureParticipationResult.value.message },
        })

      return Response.data(
        await toHistoryDTO(classroom_id, repository, batch_size, cursor_ref),
      )
    },
)

async function toHistoryDTO(
  classroom_id: string,
  repository: ClassroomFedRepository,
  batch_size: number,
  cursor_ref: string,
) {
  const { data: occursIn } = await repository.methods.query(
    QueryBuilder()
      .orderBy([{ property: 'created_at', direction: 'desc' }])
      .filterBy('target', '==', classroom_id)
      .limit(batch_size)
      .cursor(cursor_ref)
      .build(),
    OccursInURI,
  )

  const messages_ids = occursIn.map(occurs => occurs.props.source_id)
  const { data: messages } = await repository.methods.query(
    QueryBuilder().filterBy('id', 'in', messages_ids).build(),
    MessageURI,
  )

  return {
    history: await Promise.all(
      messages.map(message => toMessageDTO(message, repository)),
    ),
  }
}

async function toMessageDTO(
  message: Message,
  repository: ClassroomFedRepository,
) {
  const { id, created_at, updated_at } = message.meta

  const {
    data: [source],
  } = await repository.methods.query(
    QueryBuilder<Source>().filterBy('target_id', '==', id).build(),
    SourceURI,
  )

  const type = source.props.source_type
  const data = await repository.methods.get(source.props.source_id)

  return {
    id,
    source: {
      type,
      data: await (type === 'audio'
        ? toAudioDTO(data as Audio, repository)
        : toTextDTO(data as Text, repository)),
    },
    created_at,
    updated_at,
  }
}

async function toAudioDTO(audio: Audio, repository: ClassroomFedRepository) {
  const { filename, mime_type, duration, url, metadata } = audio.props
  const { id, created_at, updated_at } = audio.meta

  const { data: representations } = await repository.methods.query(
    QueryBuilder<Representation>().filterBy('target_id', '==', id).build(),
    RepresentationURI,
  )

  return {
    id,
    filename,
    mime_type,
    duration,
    url,
    metadata: metadata.props,
    contents: await Promise.all(
      representations.map(rep => toContentDTO(rep, repository)),
    ),
    created_at,
    updated_at,
  }
}

async function toTextDTO(text: Text, repository: ClassroomFedRepository) {
  const { content, metadata } = text.props
  const { id, created_at, updated_at } = text.meta

  const { data: representations } = await repository.methods.query(
    QueryBuilder<Representation>().filterBy('target_id', '==', id).build(),
    RepresentationURI,
  )

  return {
    id,
    content,
    metadata: metadata.props,
    contents: await Promise.all(
      representations.map(rep => toContentDTO(rep, repository)),
    ),
    created_at,
    updated_at,
  }
}

async function toContentDTO(
  representation: Representation,
  repository: ClassroomFedRepository,
) {
  const { type } = representation.props
  const text = await repository.methods.get(representation.props.source_id)

  return {
    type,
    content: text,
  }
}
