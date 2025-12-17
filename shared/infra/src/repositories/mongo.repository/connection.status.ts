/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Represents the connection state of a resource or client.
 *
 * - READY: Initialized but not yet connected. The resource
 *   is prepared for connection, but no active connection exists.
 *
 * - CONNECTED: Actively connected and operational. The resource
 *   can be used for read/write operations.
 *
 * - DISCONNECTED: Not connected or the connection has been closed.
 *   The resource cannot be used until it is reconnected.
 */

export enum CONNECTION_STATUS {
  READY,
  CONNECTED,
  DISCONNECTED,
}
