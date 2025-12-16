/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const MINUTES_TIME_IN_SECONDS = 60
const HOUR_TIME_IN_SECONDS = 60 * MINUTES_TIME_IN_SECONDS

function padTime(time: number) {
  return time.toString().padStart(2, '0')
}

export function remainingConsumptionFormat(remaining: number) {
  const totalSeconds = remaining / 1000

  const hours = Math.floor(totalSeconds / HOUR_TIME_IN_SECONDS)

  const minutes = Math.floor(
    (totalSeconds - hours * HOUR_TIME_IN_SECONDS) / MINUTES_TIME_IN_SECONDS,
  )

  const seconds = Math.floor(
    totalSeconds -
      (hours * HOUR_TIME_IN_SECONDS + minutes * MINUTES_TIME_IN_SECONDS),
  )

  return `${padTime(hours)}:${padTime(minutes)}:${padTime(seconds)}`
}
