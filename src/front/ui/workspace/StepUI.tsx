import type { StepL } from 'src/models/Step'

import { observer } from 'mobx-react-lite'
import { GraphUI } from './GraphUI'

export const StepUI = observer(function StepUI_(p: { step: StepL; depth: number }) {
    const step = p.step
    return (
        <div>
            <GraphUI graph={step.outputGraph.item} depth={p.depth} />
        </div>
    )
})
