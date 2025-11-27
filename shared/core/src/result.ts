import { Reader, ReaderTask } from '@davna/types'

export type Result<E, A> = Reader<E, A> | ReaderTask<E, A>
