import type { GraphL } from 'src/models/Graph'

import { observer } from 'mobx-react-lite'
import { Fragment } from 'react'
import { Divider, Panel } from 'rsuite'
import { ActionUI } from '../widgets/ActionUI'
import { StepUI } from './StepUI'
import { CustomNodeFlow } from '../graph/Graph2UI'
import { NodeRefUI } from '../NodeRefUI'
import { ActionSuggestionUI } from '../flow/ActionPickerUI'

export const GraphSummaryUI = observer(function GraphSummaryUI_(p: { graph: GraphL }) {
    const graph = p.graph
    return (
        <>
            <Panel className='graph-container self-start w-48'>
                {graph.size === 0 && <div>Empty Graph</div>}
                <CustomNodeFlow />
            </Panel>
            <div>
                {graph.nodes.map((n, ix) => (
                    <div key={n.uid} className='flex'>
                        <NodeRefUI node={n} />
                        {n.$schema.nameInCushy}
                    </div>
                ))}
            </div>
        </>
    )
})

export const GraphUI = observer(function GraphUI_(p: { graph: GraphL; depth: number }) {
    const graph = p.graph
    const next = graph.nextStep.item
    const actions = graph.actions.items
    const action0 = actions[0]
    return (
        <Fragment>
            <div className='flex'>
                <h4 className='mr-3'>Step {p.depth}</h4>
                {graph.childSteps.items.length === 0 ? <ActionSuggestionUI action={action0} /> : null}
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
            <div className='flex gap-2 items-baseline'>
                <ActionUI key={action0.id} action={action0} />
                <GraphSummaryUI graph={graph} />
            </div>
            <Divider />
            {next && <StepUI key={next.id} step={next} depth={p.depth + 1} />}
        </Fragment>
    )
})
