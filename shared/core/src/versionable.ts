import { applyEntry } from '@davna/utils'

export type Version = `v${number}`

export interface Versionable<V extends Version> {
  readonly __version: V
}

export const applyVersioning =
  <V extends Version>(version: V) =>
  <E>(entity: E): E & Versionable<V> =>
    applyEntry('__version', version)(entity)
