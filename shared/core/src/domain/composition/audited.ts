/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Timestamped } from './timestamped'
import { Upgradable } from './upgradable'

/**
 * Represents an object whose lifecycle is auditable.
 *
 * Combines creation and update timestamps to enable
 * change tracking and historical analysis.
 */

export interface Auditable extends Timestamped, Upgradable {}
