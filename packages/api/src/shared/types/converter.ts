export interface Converter<V, P = any> {
  to: (value: V) => P
  from: (value: P) => V
}

export type ReadonlyConverter<C extends Converter<any>> = {
  from: C['from']
}

export type WriteonlyConverter<C extends Converter<any>> = {
  to: C['to']
}
