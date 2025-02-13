import type { LiveInstance } from '../db/LiveInstance'
import type { Media3dDisplacementT } from 'src/db2/TYPES.gen'
import type { StepL } from './Step'

import { LiveRefOpt } from 'src/db/LiveRefOpt'

export interface Media3dDisplacementL extends LiveInstance<Media3dDisplacementT, Media3dDisplacementL> {}
export class Media3dDisplacementL {
    step = new LiveRefOpt<this, StepL>(this, 'stepID', 'step')
}
