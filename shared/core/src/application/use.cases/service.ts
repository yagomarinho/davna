/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { applyEntry } from '@davna/kernel'

import { Resource, verifyResource } from '../../domain'
import { ServiceOutcome } from './outcome'

/**
 * Resource identifier for services.
 *
 * Used to discriminate service functions from other
 * domain constructs at runtime.
 */
export const ServiceURI = 'service'
export type ServiceURI = typeof ServiceURI

/**
 * Internal service handler signature.
 *
 * - Data: input data required to execute the service
 * - Env: environment required by the service execution
 * - Result: output produced by the service
 *
 * The handler returns a ServiceOutcome, allowing
 * synchronous or asynchronous execution bound to an environment.
 */
interface ServiceHandler<Data, Env, Result> {
  (data: Data): ServiceOutcome<Env, Result>
}

/**
 * Public Service type.
 *
 * Represents a domain service entry point that:
 * - may or may not accept input data
 * - produces a context-aware outcome
 * - carries a resource discriminator for runtime identification
 *
 * Services are treated as first-class domain operations.
 */
export type Service<Data = void, Env = {}, Result = void> = Data extends void
  ? (() => ServiceOutcome<Env, Result>) & Resource<ServiceURI>
  : ((data: Data) => ServiceOutcome<Env, Result>) & Resource<ServiceURI>

/**
 * Service factory function.
 *
 * Wraps a handler function and attaches the service
 * resource identifier, ensuring consistent runtime shape.
 */

export function Service<Data = void, Env = {}, Result = void>(
  handler: ServiceHandler<Data, Env, Result>,
): Service<Data, Env, Result> {
  return applyEntry('_r', ServiceURI)(handler) as any
}

/**
 * Runtime type guard for services.
 *
 * Validates that a given value represents a service
 * by checking its callable nature and resource identifier.
 */

export const isService = (service: unknown): service is Service =>
  verifyResource(ServiceURI)(service)
