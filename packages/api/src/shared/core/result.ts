import { Reader, ReaderTask } from '../types'

export type Result<E, A> = Reader<E, A> | ReaderTask<E, A>
