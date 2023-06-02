import type { GraphL } from 'src/models/Graph'

import { observer } from 'mobx-react-lite'
import { Fragment } from 'react'
import { Divider } from 'rsuite'
import { ActionUI } from '../widgets/ActionUI'
import { StepUI } from './StepUI'
import { GraphSummaryUI } from './GraphSummaryUI'

export const GraphUI = observer(function GraphUI_(p: { graph: GraphL; depth: number }) {
    const graph = p.graph
    const next = graph.nextStep.item
    const actions = graph.actions.items
    const action0 = actions[0]
    return (
        <Fragment>
            <div className='flex items-baseline'>
                {/* depth */}
                <div className='mr-1'>#{p.depth}</div>

                {/* branches */}
                {graph.childSteps.map((step) => {
                    const isSelected = step.id === next?.id
                    return (
                        <div
                            key={step.id}
                            className='p-1 step-container cursor-pointer'
                            style={{ backgroundColor: isSelected ? '#797979' : undefined }}
                            onClick={() => {
                                graph.update({ nextStepID: step.id })
                                action0.update({
                                    toolID: step.tool.id,
                                    params: step.data.params,
                                })
                            }}
                        >
                            <div>{step.tool.item?.data.name}</div>
                        </div>
                    )
                })}
            </div>

            <div className='flex gap-2 items-baseline'>
                {/* action form */}
                {action0 && <ActionUI key={action0.id} action={action0} />}

                {/* input summary */}
                <GraphSummaryUI graph={graph} />
            </div>

            <Divider />
            {/* child */}
            {next && <StepUI key={next.id} step={next} depth={p.depth + 1} />}
        </Fragment>
    )
})
