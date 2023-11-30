import { observer } from 'mobx-react-lite'
import { ReactNode } from 'react'
import { RevealUI } from 'src/rsuite/RevealUI'
import { useSt } from 'src/state/stateContext'
import { StepOutput } from 'src/types/StepOutput'
import { exhaust } from 'src/utils/misc/ComfyUtils'

export const OutputPreviewWrapperUI = observer(function OutputPreviewWrapperUI_(p: {
    /** 3/4 letters max if possible */
    output: StepOutput
    /** must be able to scale to 64*64  */
    children: ReactNode
}) {
    const st = useSt()
    const sizeStr = st.outputPreviewSizeStr
    return (
        <div
            onMouseEnter={(ev) => (st.hovered = p.output)}
            onMouseLeave={() => {
                if (st.hovered === p.output) st.hovered = p.output
            }}
            tw='rounded'
            style={{ width: sizeStr, height: sizeStr }}
            className='flex flex-rowcol-info virtualBorder'
        >
            {p.children}
        </div>
    )
})
