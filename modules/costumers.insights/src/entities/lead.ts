/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'

export const LeadURI = 'lead'
export type LeadURI = typeof LeadURI

export const LeadVersion = 'v1'
export type LeadVersion = typeof LeadVersion

export interface LeadProps {
  lead: string
}

export interface Lead extends Entity<LeadProps, LeadURI, LeadVersion> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    readonly [LeadURI]: Lead
  }
}

export function createLead(props: LeadProps): DraftEntity<Lead>
export function createLead(
  props: LeadProps,
  meta: undefined,
  _version: LeadVersion,
): DraftEntity<Lead>
export function createLead(
  props: LeadProps,
  meta: EntityMeta,
  _version?: LeadVersion,
): Lead
export function createLead(
  { lead }: LeadProps,
  meta?: EntityMeta,
  _version: LeadVersion = LeadVersion,
): Lead {
  return createEntity(LeadURI, _version, createLead, { lead }, meta as any)
}
