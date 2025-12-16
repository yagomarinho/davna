/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function getSlugFromUrl(url: string): string | undefined {
  const paths = url.split('/').filter(Boolean)

  return paths[paths.length - 1]
}
