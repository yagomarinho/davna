export type Version = `v${number}`

export interface Versioned<U extends Version> {
  readonly _v: U
}
