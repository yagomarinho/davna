export interface UID {
  generate: () => string
  validate: (uid: string) => boolean
}
