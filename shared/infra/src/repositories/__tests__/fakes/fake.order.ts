/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createEntity, DraftEntity, Entity, EntityMeta } from '@davna/core'
import { concatenate } from '@davna/kernel'

export interface OrderProps {
  value: number
}

export const OrderURI = 'order'
export type OrderURI = typeof OrderURI

export const OrderVersion = 'v1'
export type OrderVersion = typeof OrderVersion

export interface Order extends Entity<OrderProps, OrderURI, OrderVersion> {}

declare module '@davna/core' {
  interface EntityURItoKind {
    [OrderURI]: Order
  }
}

export function createOrder(props: OrderProps): DraftEntity<Order>
export function createOrder(props: OrderProps, meta: EntityMeta): Order
export function createOrder({ value }: OrderProps, meta?: EntityMeta): any {
  return createEntity(
    OrderURI,
    OrderVersion,
    createOrder,
    { value },
    meta as any,
  )
}

export function setValue(
  value: number,
  order: DraftEntity<Order>,
): DraftEntity<Order>
export function setValue(value: number, order: Order): Order
export function setValue(
  value: number,
  order: DraftEntity<Order> | Order,
): DraftEntity<Order> | Order {
  return createOrder(concatenate(order.props, { value }), order.meta as any)
}
