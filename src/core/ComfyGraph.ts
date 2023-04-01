import type { VisEdges, VisNodes } from '../ui/VisUI'
import type { ComfyNodeUID } from './ComfyNodeUID'
import type { Project } from './Project'
import type { ComfyPromptJSON } from './ComfyPrompt'
import type { Maybe } from './ComfyUtils'
import type { Run } from './Run'
import type { ScriptStep_prompt } from './ScriptStep_prompt'

// import { BranchUserApi, GitgraphUserApi } from '@gitgraph/core'
import { computed, makeObservable } from 'mobx'
import { nanoid } from 'nanoid'
import { Workspace } from './Workspace'
import { comfyColors } from './ComfyColors'
import { ComfyNode } from './CSNode'
import { ComfyNodeSchema, ComfySchema } from './ComfySchema'
import { wildcards } from '../wildcards/wildcards'
import { PromptOutputImage } from './PromptOutputImage'
import { Cyto } from '../graph/cyto'
import { logger } from '../logger/Logger'

export type RunMode = 'fake' | 'real'

export class ComfyGraph {
    uid = nanoid()
    get client(): Workspace { return this.project.workspace } // prettier-ignore
    get schema() { return this.client.schema } // prettier-ignore

    cyto?: Cyto

    uploadImgFromDisk = async (path: string) => {
        return this.run.project.workspace.uploadImgFromDisk(path)
    }

    registerNode = (node: ComfyNode<any>) => {
        this.nodesIndex.set(node.uid, node)
        this.cyto?.trackNode(node)
        // this.graph.run.cyto.addNode(this)
    }
    get nodes() { return Array.from(this.nodesIndex.values()) } // prettier-ignore
    nodesIndex = new Map<string, ComfyNode<any>>()
    isRunning = false

    /** pick a random seed */
    randomSeed() {
        const seed = Math.floor(Math.random() * 99999999)
        this.print('🔥 random seed: ' + seed)
        return seed
    }

    wildcards = wildcards

    /** return the coresponding comfy prompt  */
    get json(): ComfyPromptJSON {
        const json: ComfyPromptJSON = {}
        for (const node of this.nodes) {
            json[node.uid] = node.json
            // if (node.$schema.name === 'VAEEncode') {
            //     console.log('🔥', node.$schema.name)
            //     console.log(node.inputs.pixels)
            //     console.log(node.inputs.pixels?.$schema?.name)
            //     console.log(JSON.stringify(node.json))
            // }
        }
        return json
    }

    convertToImageInput = (x: PromptOutputImage): string => {
        return `../outputs/${x.data.filename}`
        // return this.LoadImage({ image: name })
    }

    /** temporary proxy */
    convertToImageInputOLD1 = async (x: PromptOutputImage): Promise<string> => {
        const name = await x.makeAvailableAsInput()
        console.log('[convertToImageInput]', { name })
        // @ts-ignore
        return name
        // return this.LoadImage({ image: name })
    }

    // INTERRACTIONS
    askBoolean = (msg: string, def?: Maybe<boolean>): Promise<boolean> => this.run.askBoolean(msg, def)
    askString = (msg: string, def?: Maybe<string>): Promise<string> => this.run.askString(msg, def)
    print = (msg: string) => logger.info('🔥', msg)

    constructor(
        //
        public project: Project,
        public run: Run,
        json: ComfyPromptJSON = {},
    ) {
        // console.log('COMFY GRAPH')
        makeObservable(this, { allImages: computed })
        for (const [uid, node] of Object.entries(json)) {
            new ComfyNode(this, uid, node)
        }
        // inject properties:
        // TODO: rewrite with a single defineProperties call
        // with propery object being defined on the client
        // to remove all this extra work
        const schema = project.schema
        for (const node of schema.nodes) {
            // console.log(`node: ${node.name}`)
            Object.defineProperty(this, node.nameInCushy, {
                value: (inputs: any) =>
                    new ComfyNode(this, this.getUID(), {
                        class_type: node.nameInComfy as any,
                        inputs,
                    }),
            })
        }
    }

    private _nextUID = 1
    getUID = () => (this._nextUID++).toString()
    getNodeOrCrash = (nodeID: ComfyNodeUID): ComfyNode<any> => {
        const node = this.nodesIndex.get(nodeID)
        if (node == null) throw new Error('Node not found:' + nodeID)
        return node
    }

    /** all images generated by nodes in this graph */
    get allImages(): PromptOutputImage[] {
        return this.nodes.flatMap((a) => a.images)
    }

    /** wether it should really send the prompt to the backend */
    get runningMode(): RunMode {
        return this.run.opts?.mock ? 'fake' : 'real'
    }

    // COMMIT --------------------------------------------
    async get(): Promise<ScriptStep_prompt> {
        // console.log('A')
        const step = this.run.sendPromp()
        // this.run.cyto.animate()
        // console.log('B')
        await step.finished
        // console.log('C')
        // console.log(`🐙`, step.uid, step.images.length, { step }, step.images[0].url)
        return step
    }

    // JSON_forGitGraphVisualisation = (gitgraph: GitgraphUserApi<any>) => {
    //     // extract graph
    //     const ids: TNode[] = []
    //     const edges: TEdge[] = []
    //     for (const node of this.nodesArray) {
    //         ids.push(node.uid)
    //         for (const fromUID of node._incomingNodes()) edges.push([fromUID, node.uid])
    //     }
    //     // sort it
    //     const sortedIds = toposort(ids, edges)
    //     // renderit
    //     const invisible = { renderDot: () => null, renderMessage: () => null }
    //     const cache: { [key: string]: BranchUserApi<any> } = {}
    //     const master = gitgraph.branch('master').commit(invisible)
    //     for (const id of sortedIds) {
    //         const node = this.nodes.get(id)!
    //         const branch = master.branch(node.uid)
    //         cache[id] = branch.commit({ body: node.$schema.name, renderDot: () => null, renderMessage: () => null })
    //         for (const fromUID of node._incomingNodes())
    //             cache[id] = branch.merge({ fastForward: true, branch: fromUID, commitOptions: invisible })
    //         cache[id] = branch.commit({ body: node.$schema.name })
    //     }
    // }

    /** visjs JSON format (network visualisation) */
    get JSON_forVisDataVisualisation(): { nodes: VisNodes[]; edges: VisEdges[] } {
        const json: ComfyPromptJSON = this.json
        const schemas: ComfySchema = this.schema
        const nodes: VisNodes[] = []
        const edges: VisEdges[] = []
        if (json == null) return { nodes: [], edges: [] }
        for (const [uid, node] of Object.entries(json)) {
            const schema: ComfyNodeSchema = schemas.nodesByNameInComfy[node.class_type]
            const color = comfyColors[schema.category]
            nodes.push({ id: uid, label: node.class_type, color, font: { color: 'white' }, shape: 'box' })
            for (const [name, val] of Object.entries(node.inputs)) {
                if (val instanceof Array) {
                    const [from, slotIx] = val
                    const edgeID = `${from}-${uid}-${slotIx}`
                    edges.push({ id: edgeID, from, to: uid, arrows: 'to', label: name, labelHighlightBold: false, length: 200 })
                }
            }
        }
        return { nodes, edges }
    }
}
