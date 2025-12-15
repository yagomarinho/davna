import { Timestamped } from './timestamped'
import { Upgradable } from './upgradable'

export interface Auditable extends Timestamped, Upgradable {}
