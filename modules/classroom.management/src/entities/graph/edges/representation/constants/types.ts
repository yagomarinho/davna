/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export enum REPRESENTATION_TYPE {
  // TRANSFORMATION
  TRANSLATION = 'translation',
  TRANSCRIPTION = 'transcription',

  // ABSTRACTION
  SUMMARY = 'summary',
  SYNTHESIS = 'synthesis',

  // ANALYSIS
  EMOTIONS = 'emotions',
  SENTIMENT = 'sentiment',
  TOPICS = 'topics',
  INTENT = 'intent',

  // METADATA
  TECHNICAL = 'technical',
  CONTEXTUAL = 'contextual',

  // MULTIPLES PURPOSES
  DESCRIPTION = 'description',
}
