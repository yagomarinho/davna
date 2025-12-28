/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Edge, EdgeProps } from '../edge'
import { RepresentationBase } from './contracts'

export const RepresentationURI = 'representation'
export type RepresentationURI = typeof RepresentationURI

export const RepresentationVersion = 'v1'
export type RepresentationVersion = typeof RepresentationVersion

// in representation
// text.id is source_id
// resource.id is target_id
export interface RepresentationProps extends EdgeProps, RepresentationBase {}

export interface Representation extends Edge<
  RepresentationProps,
  RepresentationURI,
  RepresentationVersion
> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [RepresentationURI]: Representation
  }
}
