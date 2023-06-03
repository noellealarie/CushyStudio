import type { GraphL } from 'src/models/Graph'

import { observer } from 'mobx-react-lite'
import { Fragment } from 'react'
import { Divider, Panel } from 'rsuite'
import { ActionPlaceholderUI, ActionUI } from '../widgets/ActionUI'
import { StepUI } from './StepUI'
import { GraphSummaryUI } from './GraphSummaryUI'
import { GalleryImageUI } from '../galleries/GalleryImageUI'
import { ComfyNodeUI } from '../NodeListUI'
import { StepL, StepOutput } from 'src/models/Step'

export const GraphUI = observer(function GraphUI_(p: { graph: GraphL; depth: number }) {
    const graph = p.graph
    const next = graph.nextStep.item
    const actions = graph.actions.items
    const action0 = actions[0]
    return (
        <Fragment>
            <div className='flex items-baseline wrap'>
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
                <div>
                    {action0 ? <ActionUI key={action0.id} action={action0} /> : <ActionPlaceholderUI />}
                    {next && next.data.outputs?.map((output, ix) => <StepOutputUI key={ix} step={next} output={output} />)}
                </div>

                {/* input summary */}
                <GraphSummaryUI graph={graph} />
            </div>

            <Divider />
            {/* child */}
            {next && <StepUI key={next.id} step={next} depth={p.depth + 1} />}
        </Fragment>
    )
})

export const StepOutputUI = observer(function OutputUI_(p: { step: StepL; output: StepOutput }) {
    const msg = p.output
    const graph = p.step.outputGraph.item

    if (msg.type === 'print')
        return (
            <div>
                <div>💬 {msg.message}</div>
            </div>
        )
    if (msg.type === 'prompt') {
        const prompt = graph.db.prompts.get(msg.promptID)
        const currNode = prompt?.graph.item.currentExecutingNode
        return (
            <div>
                {/* <div>🪑 prompt</div> */}
                {currNode && <ComfyNodeUI node={currNode} />}
                <div className='flex'>
                    {prompt?.images.map((img) => (
                        <GalleryImageUI img={img} />
                    ))}
                </div>
            </div>
        )
    }
    if (msg.type === 'executed') return <div>✅</div>

    return <>ok</>
})
