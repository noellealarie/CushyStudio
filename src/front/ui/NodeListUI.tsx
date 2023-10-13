import { observer } from 'mobx-react-lite'
import { Form, Panel, Progress } from 'rsuite'
import { GraphL } from '../../models/Graph'
import { ComfyNode } from '../../core/Node'
import { ComfyNodeSchema } from '../../models/Schema'
import { NodeRefUI } from './NodeRefUI'
import { useSt } from '../FrontStateCtx'
import { Fragment } from 'react'

export const ComfyNodeUI = observer(function ComfyNodeUI_(p: {
    //
    node: ComfyNode<any>
    showArtifacts?: boolean
}) {
    const st = useSt()
    const node = p.node
    const uid = node.uid
    const graph: GraphL | undefined = node.graph
    if (graph == null) return <>no execution yet</>
    const curr: ComfyNode<any> = graph.nodesIndex.get(uid)!
    const name = curr.$schema.nameInComfy
    // const schema: ComfyNodeSchema = curr.$schema
    const percent = node.status === 'done' ? 100 : ((node.progress?.value ?? 0) / (node.progress?.max || 1)) * 100
    const isDone = node.status === 'done'
    return (
        <div
            // collapsible
            // onClick={() => (st.expandNodes = !st.expandNodes)}
            // header={
            // }
            style={{ position: 'relative' }}
            // bordered
            // shaded
            // key={uid}
            // className='node'
        >
            <div className='row items-center gap'>
                <NodeRefUI node={node} />
                <Progress.Line
                    style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
                    showInfo={false}
                    strokeWidth={2}
                    status={isDone ? 'success' : 'active'}
                    percent={percent}
                />
                {name}
            </div>
            <div className='row'>
                {/* {folded ? null : ( */}
                <div>
                    {/* show all */}
                    {/* <div>
                        {schema.inputs.map((input) => {
                            let val = node.json.inputs[input.name]
                            if (Array.isArray(val)) val = <NodeRefUI nodeUID={val[0]} graph={graph} />
                            return (
                                <div key={input.name} className='prop row'>
                                    <div className='propName'>{input.name}</div>
                                    <div className='propValue'>{val}</div>
                                </div>
                            )
                        })}
                    </div> */}
                </div>
            </div>
            {/* )} */}
        </div>
    )
})

// <div className='flex gap-2 wrap'>
//     {/* show values */}
//     <div className='flex'>
//         {schema.inputs.map((input) => {
//             let val = node.json.inputs[input.nameInComfy]
//             if (Array.isArray(val)) return null
//             return (
//                 <Fragment key={input.nameInComfy}>
//                     <span>{input.nameInComfy}</span>
//                     <span>{val}</span>
//                 </Fragment>
//             )
//         })}
//     </div>
//     {/* show refs */}
//     <div>
//         {schema.inputs.map((input) => {
//             let val = node.json.inputs[input.nameInComfy]
//             if (!Array.isArray(val)) return null
//             return (
//                 <div key={input.nameInComfy} className='row gap-2'>
//                     <Form.ControlLabel>{<NodeRefUI node={node} />}</Form.ControlLabel>
//                     <Form.ControlLabel>{input.nameInComfy}</Form.ControlLabel>
//                 </div>
//             )
//         })}
//     </div>
// </div>
