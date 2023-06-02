import type { GraphL } from 'src/models/Graph'

import { observer } from 'mobx-react-lite'
import { Fragment } from 'react'
import { Panel } from 'rsuite'
import { ActionUI } from '../widgets/ActionUI'
import { StepUI } from './StepUI'

export const GraphSummaryUI = observer(function GraphSummaryUI_(p: { graph: GraphL }) {
    const graph = p.graph
    return (
        <Panel className='graph-container self-start w-48'>
            {graph.size === 0 && <div>Empty Graph</div>}
            {graph.summary1.map((i, ix) => (
                <div key={ix}>- {i}</div>
            ))}
        </Panel>
    )
})

export const GraphUI = observer(function GraphUI_(p: { graph: GraphL; depth: number }) {
    const graph = p.graph
    const next = graph.nextStep.item

    return (
        <Fragment>
            <div className='flex gap-2'>
                {graph.actions.map((action) => (
                    <ActionUI key={action.id} action={action} />
                ))}
                <GraphSummaryUI graph={graph} />
            </div>
            <div className='flex'>
                {graph.childSteps.map((step) => {
                    const isSelected = step.id === next?.id
                    return (
                        <div
                            key={step.id}
                            className='p-1 step-container cursor-pointer'
                            style={{ backgroundColor: isSelected ? '#797979' : undefined }}
                            onClick={() => graph.update({ nextStepID: step.id })}
                        >
                            <div>{step.tool.item?.data.name}</div>
                        </div>
                    )
                })}
            </div>
            {next && <StepUI key={next.id} step={next} depth={p.depth + 1} />}
        </Fragment>
    )
})
