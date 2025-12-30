/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Identifiable, Tag } from '@davna/core'

export const AuthContextURI = 'auth.context'
export type AuthContextURI = typeof AuthContextURI

/**
 * Represents the entity that is **performing an action** in the system.
 *
 * The actor is responsible for the execution context of an operation
 * and may or may not be the same entity as the authenticated principal.
 *
 * Examples:
 * - An `account` acting on its own behalf
 * - An `agent` acting on behalf of an account
 */
export interface Actor {
  /**
   * Actor category.
   *
   * - `account`: the account itself is performing the action
   * - `agent`: a delegated or system agent is performing the action
   */
  type: 'account' | 'agent'

  /**
   * Identifier of the subject represented by this actor.
   *
   * This value is **not guaranteed** to match the authenticated account id,
   * especially when the actor is an `agent`.
   */
  subject_id: string
}

/**
 * Represents the **authenticated principal** of the request.
 *
 * The principal identifies **who is authenticated**, regardless of
 * who is performing the action (actor).
 */
export interface Principal {
  /**
   * Authenticated account information.
   *
   * This is the security identity used for authorization,
   * auditing and policy enforcement.
   */
  account: Identifiable
}

/**
 * Authorization context shared across handlers, services and policies.
 *
 * It separates **authentication** (`principal`) from **action execution**
 * (`actor`), allowing scenarios such as:
 *
 * - impersonation
 * - delegated access
 * - system or service accounts
 */
export interface AuthContext extends Tag<AuthContextURI> {
  /**
   * Entity performing the action.
   */
  actor: Actor

  /**
   * Authenticated security principal.
   */
  principal: Principal
}

export function createAuthContext(
  account: Identifiable,
  actor?: Actor,
): AuthContext {
  return {
    actor: actor ? actor : { type: 'account', subject_id: account.id },
    principal: { account },
    _t: AuthContextURI,
  }
}
