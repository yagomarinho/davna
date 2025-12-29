/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Duration, TIME_UNITS } from '@davna/kernel'

interface DurationInSec extends Duration {
  unit: TIME_UNITS.SEC
}

export function ensureDurationInSeconds({
  value,
  unit,
}: Duration): DurationInSec {
  switch (unit) {
    case TIME_UNITS.SEC:
      return {
        unit,
        value,
      }

    case TIME_UNITS.MS:
      return {
        unit: TIME_UNITS.SEC,
        value: value / 1000,
      }
  }
}
