/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Duration, TIME_UNITS } from '@davna/kernel'
import { Usage, USAGE_UNITS } from '../entities'
import { CONFIDENCE } from '../services'

const ESTIMATED_DURATION_FACTOR = 1.15

export function checkDurationTolerance(
  duration: Duration,
  usage: Usage,
): boolean {
  const { unit, value } = usage.props.consumption.props

  if (!ensureUnit(unit)) return false

  const { confidence } = usage.props.metadata.props
  const tolerance = resolveValueTolerance(confidence, value)

  return duration.unit === unit && duration.value <= tolerance
}

function ensureUnit(unit: USAGE_UNITS): unit is TIME_UNITS {
  return Object.values(TIME_UNITS).includes(unit as any)
}

function resolveValueTolerance(confidence: CONFIDENCE, value: number): number {
  if (confidence === 'deterministic') return value
  return ESTIMATED_DURATION_FACTOR * value
}
