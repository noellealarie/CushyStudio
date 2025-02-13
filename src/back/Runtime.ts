import type { WidgetDict } from 'src/cards/Card'
import type { Printable } from '../core/Printable'

import * as path from 'pathe'
// import { Cyto } from '../graph/cyto' 🔴🔴
import { execSync } from 'child_process'
import fs, { writeFileSync } from 'fs'
import { marked } from 'marked'
import { Uploader } from 'src/state/Uploader'
import type { STATE } from 'src/state/state'
import { assets } from 'src/utils/assets/assets'
import { braceExpansion } from 'src/utils/misc/expansion'
import { ImageAnswer } from '../controls/misc/InfoAnswer'
import { ComfyNodeOutput } from '../core/Slot'
import { auto } from '../core/autoValue'
import { ComfyWorkflowL } from '../models/Graph'
import { MediaImageL } from '../models/MediaImage'
import { ComfyPromptL } from '../models/ComfyPrompt'
import { StepL } from '../models/Step'
import { ApiPromptInput, ComfyUploadImageResult, PromptInfo } from '../types/ComfyWsApi'
import { createMP4FromImages } from '../utils/ffmpeg/ffmpegScripts'
import { asAbsolutePath, asRelativePath } from '../utils/fs/pathUtils'
import { deepCopyNaive, exhaust } from '../utils/misc/ComfyUtils'
import { wildcards } from '../widgets/prompter/nodes/wildcards/wildcards'
import { IDNaminScheemeInPromptSentToComfyUI } from './IDNaminScheemeInPromptSentToComfyUI'
import { ImageSDK } from './ImageSDK'
import { ComfyWorkflowBuilder } from './NodeBuilder'
import { InvalidPromptError } from './RuntimeError'
import { Status } from './Status'
import { bang } from 'src/utils/misc/bang'

export type ImageAndMask = HasSingle_IMAGE & HasSingle_MASK

/** script exeuction instance */
export class Runtime<FIELDS extends WidgetDict = any> {
    /**
     * the global CushyStudio app state
     * Apps should probably never touch this directly.
     * But also, do what you want. you're a grown up.
     * */
    st: STATE

    /**
     * filesystem library.
     * your app can do IO.
     * with great power comes great responsibility.
     */
    fs = fs

    /**
     * path manifulation library;
     * avoid concateing paths yourself if you want your app
     */
    path = path

    constructor(public step: StepL) {
        this.st = step.st
        this.folder = step.st.outputFolderPath
        this.upload_FileAtAbsolutePath = this.st.uploader.upload_FileAtAbsolutePath.bind(this.st.uploader)
        this.upload_ImageAtURL = this.st.uploader.upload_ImageAtURL.bind(this.st.uploader)
        this.upload_dataURL = this.st.uploader.upload_dataURL.bind(this.st.uploader)
        this.upload_Asset = this.st.uploader.upload_Asset.bind(this.st.uploader)
        this.upload_Blob = this.st.uploader.upload_Blob.bind(this.st.uploader)
    }

    /**
     * get the configured trigger words for the given lora
     * (those are user defined; hover your lora in any rich text prompt to edit them)
     */
    getLoraAssociatedTriggerWords = (loraName: string): Maybe<string> => {
        return this.st.configFile.value?.loraPrompts?.[loraName]?.text
    }

    /** get the current json form result */
    formResult!: { [k in keyof FIELDS]: FIELDS[k]['$Output'] }

    /** get the extended json form value including internal state */
    formSerial!: { [k in keyof FIELDS]: FIELDS[k]['$Serial'] }

    /**
     * get your configured lora metada
     * (those are user defined; hover your lora in any rich text prompt to edit them)
     */
    getLoraAssociatedMetadata = (
        loraName: string,
    ): Maybe<{
        text?: string | undefined
        url?: string | undefined
    }> => {
        return this.st.configFile.value?.loraPrompts?.[loraName]
    }

    /** retrieve the global schema */
    get schema() { return this.st.schema } // prettier-ignore

    /** the default app's ComfyUI graph we're manipulating */
    get workflow(): ComfyWorkflowL {
        return this.step.outputWorkflow.item
    }

    /** graph buider */
    get nodes(): ComfyWorkflowBuilder {
        return this.workflow.builder
    }

    // ====================================================================
    // miscs subgraphs until there is a better place to place them

    /** a built-in prefab to quickly
     * add PreviewImage & JoinImageWithAlpha node to your ComfyUI graph */
    add_previewImageWithAlpha = (image: HasSingle_IMAGE & HasSingle_MASK) => {
        return this.nodes.PreviewImage({
            images: this.nodes.JoinImageWithAlpha({
                image: image,
                alpha: image,
            }),
        })
    }

    /** a built-in prefab to quickly
     * add a PreviewImage node to your ComfyUI graph */
    add_previewImage = (image: HasSingle_IMAGE) => {
        return this.nodes.PreviewImage({ images: image })
    }

    /** a built-in prefab to quickly
     * add a PreviewImage node to your ComfyUI graph */
    add_saveImage = (image: HasSingle_IMAGE, prefix?: string) => {
        return this.nodes.SaveImage({ images: image, filename_prefix: prefix })
    }

    // ====================================================================

    /** helper to auto-find an output slot and link use it for this input */
    AUTO = auto

    /** helper to chose radomly any item from a list */
    chooseRandomly = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

    /** execute the app */
    run = async (): Promise<Status> => {
        const start = Date.now()
        const app = this.step.appCompiled
        const appFormInput = this.step.data.formResult
        const appFormSerial = this.step.data.formSerial.values_
        this.formResult = appFormInput
        this.formSerial = appFormSerial
        // console.log(`🔴 before: size=${this.graph.nodes.length}`)
        // console.log(`FORM RESULT: data=${JSON.stringify(this.step.data.formResult, null, 3)}`)
        try {
            if (app == null) {
                console.log(`❌ action not found`)
                return Status.Failure
            }
            await app.run(this, appFormInput)
            console.log(`🔴 after: size=${this.workflow.nodes.length}`)
            console.log('[✅] RUN SUCCESS')
            const duration = Date.now() - start
            return Status.Success
        } catch (error: any /* 🔴 */) {
            console.log(error)
            console.error('🌠', (error as any as Error).name)
            console.error('🌠', (error as any as Error).message)
            console.error('🌠', 'RUN FAILURE')
            this.st.db.runtimeErrors.create({
                message: error.message,
                infos: error,
                graphID: this.workflow.id,
                stepID: this.step.id,
            })
            return Status.Failure
        }
    }

    /** check if the current connected ComfyUI backend has a given lora by name */
    hasLora = (loraName: string): boolean => this.schema.hasLora(loraName)

    /** check if the current connected ComfyUI backend has a given checkpoint */
    hasCheckpoint = (loraName: string): boolean => this.schema.hasLora(loraName)

    /** run an imagemagick convert action */
    imagemagicConvert = (
        //
        img: MediaImageL,
        partialCmd: string,
        suffix: string,
    ): string => {
        const pathA = img.absPath
        // 🔴 wait
        const pathB = `${pathA}.${suffix}.png`
        const cmd = `convert "${pathA}" ${partialCmd} "${pathB}"`
        this.exec(cmd)
        return pathB
    }

    // graph engine instance for smooth and clever auto-layout algorithms
    // cyto: Cyto 🔴🔴

    /** list of all images produed over the whole script execution */
    // generatedImages: ImageL[] = []
    get lastImage(): Maybe<MediaImageL> {
        return this.generatedImages[this.generatedImages.length - 1]
    }
    get generatedImages(): MediaImageL[] {
        return this.step.generatedImages
    }
    // get firstImage() { return this.generatedImages[0] } // prettier-ignore
    // get lastImage() { return this.generatedImages[this.generatedImages.length - 1] } // prettier-ignore

    folder: AbsolutePath

    /** list of all built-in assets, with completion for quick demos  */
    assets = assets

    /**
     * a full-featured image builder SDK, based on Konva, extended with
     * top level helpers dedicated to StableDiffusion workflows, and CushyStudio
     */
    loadImageSDK = () => ImageSDK.init(this.st)

    /** quick helper to make your card sleep for a given number fo milisecond */
    sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

    // High level API--------------------

    expandBraces = (string: string): string[] => {
        return braceExpansion(string)
    }

    // ------------------------------------------------------------------------------------

    output_GaussianSplat = (p: { url: string }) => {
        this.st.db.media_splats.create({
            url: p.url,
            stepID: this.step.id,
        })
    }
    /** output a 3d scene from an image and its displacement and depth maps */
    output_3dImage = (p: {
        //
        image: string
        depth: string
        normal: string
    }) => {
        const image = this.generatedImages.find((i) => i.filename.startsWith(p.image))
        const depth = this.generatedImages.find((i) => i.filename.startsWith(p.depth))
        const normal = this.generatedImages.find((i) => i.filename.startsWith(p.normal))
        if (image == null) throw new Error(`image not found: ${p.image}`)
        if (depth == null) throw new Error(`image not found: ${p.image}`)
        if (normal == null) throw new Error(`image not found: ${p.image}`)
        this.st.db.media_3d_displacement.create({
            // type: 'displaced-image',
            width: image.data.width ?? 512,
            height: image.data.height ?? 512,
            image: image.url,
            depthMap: depth.url,
            normalMap: normal.url,
            stepID: this.step.id,
        })
        console.log('🟢🟢🟢🟢🟢🟢 displaced')
        // this.st.layout.FOCUS_OR_CREATE('DisplacedImage', {
        //     width: image.data.width ?? 512,
        //     height: image.data.height ?? 512,
        //     image: image.url,
        //     depthMap: depth.url,
        //     normalMap: normal.url,
        // })
    }

    // ------------------------------------------------------------------------------------
    // output_image = (p: { url: string }) => {
    //     const img = this.st.db.images.create({
    //         downloaded: true,
    //         localFilePath: './foobbabbababa',
    //         comfyImageInfo: { filename: 'test' },
    //     })
    //     this.st.layout.FOCUS_OR_CREATE('DisplacedImage', {
    //         width: image.data.width ?? 512,
    //         height: image.data.height ?? 512,
    //         image: image.url,
    //         depthMap: depth.url,
    //         normalMap: normal.url,
    //     })
    // }

    output_File = async (path: RelativePath, content: string): Promise<void> => {
        const absPath = this.st.resolve(this.folder, path)
        writeFileSync(absPath, content, 'utf-8')
    }

    output_HTML = (p: { htmlContent: string; title: string }) => {
        this.st.db.media_texts.create({
            kind: 'html',
            content: p.htmlContent,
            stepID: this.step.id,
        })
        // this.step.addOutput({
        //     type: 'show-html',
        //     content: p.htmlContent,
        //     title: p.title,
        // })
        // this.st.broadCastToAllClients({ type: 'show-html', content: p.htmlContent, title: p.title })
    }

    output_Markdown = (markdownContent: string) => {
        this.st.db.media_texts.create({
            kind: 'markdown',
            content: markdownContent,
            stepID: this.step.id,
        })

        // const htmlContent = marked.parse(p.markdownContent)
        // this.step.addOutput({ type: 'show-html', content: htmlContent, title: p.title })
        // this.st.broadCastToAllClients({ type: 'show-html', content: htmlContent, title: p.title })
    }
    // ===================================================================================================

    // private
    downloadURI = (uri: string, name: string) => {
        var link = document.createElement('a')
        link.download = name
        link.href = uri
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        // delete link
    }

    static VideoCounter = 1
    createAnimation = async (
        /** image to incldue (defaults to all images generated in the fun) */
        source?: MediaImageL[],
        /** FPS (e.g. 60, 30, etc.) default is 30 */
        inputFPS = 30,
        opts: { transparent?: Maybe<boolean> } = {},
    ): Promise<void> => {
        // 1. path
        console.log('🎥 creating animation')

        // 2. ensure we have enough outputs
        const images = source ?? this.generatedImages
        if (images.length === 1) return this.step.recordError(`only one image to create animation`, {})
        if (images.length === 0)
            return this.step.recordError(`no images to create animation; did you forget to call prompt() first ?`, {})

        console.info(`🎥 awaiting all files to be ready locally...`)
        await Promise.all(images.map((i) => i.finished))
        console.info(`🎥 all files are ready locally`)

        const outputAbsPath = this.st.cacheFolderPath
        const targetVideoAbsPath = asAbsolutePath(path.join(outputAbsPath, `video-${Date.now()}-${Runtime.VideoCounter++}.mp4`))
        console.log('🎥 outputAbsPath', outputAbsPath)
        console.log('🎥 targetVideoAbsPath', targetVideoAbsPath)
        const cwd = outputAbsPath

        // 4. create video
        console.info(`🎥 this.folder.path: ${this.folder}`)
        console.info(`🎥 cwd: ${cwd}`)
        const allAbsPaths = images.map((i) => i.absPath).filter((p) => p != null) as AbsolutePath[]
        await createMP4FromImages(allAbsPaths, targetVideoAbsPath, inputFPS, cwd, opts)
        this.st.db.media_images.create({ infos: { type: 'video-local-ffmpeg', absPath: targetVideoAbsPath } })
    }

    /**
     * Takes an embedding name and format it for ComfyUI usage
     * e.g.: "EasyNegative" => "embedding:EasyNegative"
     * */
    formatEmbeddingForComfyUI = (t: Embeddings) => `embedding:${t}`

    // 🐉 /** ask the user a few informations */
    // 🐉 ask: InfoRequestFn = async <const Req extends { [key: string]: Widget }>(
    // 🐉     //
    // 🐉     requestFn: (q: FormBuilder) => Req,
    // 🐉     layout?: 0,
    // 🐉 ): Promise<{ [key in keyof Req]: InfoAnswer<Req[key]> }> => {
    // 🐉     const reqBuilder = new FormBuilder()
    // 🐉     const request = requestFn(reqBuilder)
    // 🐉     const ask = new ScriptStep_ask(request)
    // 🐉     // this.st.broadCastToAllClients({ type: 'ask', flowID: this.uid, form: request, result: {} })
    // 🐉     // this.steps.unshift(ask)
    // 🐉     return ask.finished
    // 🐉 }

    /**
     * execute a shell command
     * @beta
     */
    exec = (comand: string): string => {
        // promisify exec to run the command and collect the output
        this.output_text('🔥 exec: ' + comand)
        const cwd = this.st.rootPath
        console.log('cwd', cwd)
        const res = execSync(comand, { encoding: 'utf-8', cwd })
        return res
    }

    /** built-in wildcards */
    wildcards = wildcards

    /**
     * get a random int seed
     * between 0 and 99999999
     */
    randomSeed() {
        const seed = Math.floor(Math.random() * 99999999)
        // this.print('seed: ' + seed)
        return seed
    }

    loadImageAnswerAsEnum = async (ia: ImageAnswer): Promise<Enum_LoadImage_image> => {
        try {
            if (ia.type === 'CushyImage') {
                const img = this.st.db.media_images.getOrThrow(ia.imageID)
                // this.print(JSON.stringify(img.data, null, 3))
                if (img.absPath) {
                    const res = await this.upload_FileAtAbsolutePath(img.absPath)
                    return res.name as Enum_LoadImage_image // 🔴
                }
                return img.absPath as Enum_LoadImage_image // 🔴
                // // console.log(img.data)
                // return this.nodes.Image_Load({
                //     image_path: img.url ?? img.localAbsolutePath,
                //     RGBA: false, // 'false',
                // })
            }
            if (ia.type === 'ComfyImage') return ia.imageName
            if (ia.type === 'PaintImage') {
                // const res = await this.uploadAnyFile(ia.base64)
                // return res.name as Enum_LoadImage_image
                throw new Error('🔴 not implemented')
            }
            exhaust(ia)
        } catch (err) {
            console.log('❌ failed to convert ImageAnser to Enum_LoadImage_image', ia)
            throw err
        }
        throw new Error('FAILURE to load image answer as enum')
    }

    loadImageAnswer2 = async (
        ia: ImageAnswer,
    ): Promise<{
        img: ImageAndMask
        width: number
        height: number
    }> => {
        if (ia.type === 'CushyImage') {
            const mediaImage = this.st.db.media_images.getOrThrow(ia.imageID)
            // this.print(JSON.stringify(img.data, null, 3))
            if (mediaImage.absPath) {
                const res = await this.upload_FileAtAbsolutePath(mediaImage.absPath)
                const img = this.nodes.LoadImage({ image: res.name as any })
                return { img, width: bang(mediaImage.data.width), height: bang(mediaImage.data.height) }
            }
        }
        throw new Error('ERROR')
    }

    loadImageAnswer = async (ia: ImageAnswer): Promise<ImageAndMask> => {
        try {
            // if (ia.type === 'imagePath') {
            //     return this.nodes.WASImageLoad({ image_path: ia.absPath, RGBA: 'false' })
            // }
            if (ia.type === 'CushyImage') {
                const img = this.st.db.media_images.getOrThrow(ia.imageID)
                // this.print(JSON.stringify(img.data, null, 3))
                if (img.absPath) {
                    const res = await this.upload_FileAtAbsolutePath(img.absPath)
                    // this.print(JSON.stringify(res))

                    const img2 = this.nodes.LoadImage({ image: res.name as any })
                    // if (p?.joinImageWithAlpha) return this.nodes.JoinImageWithAlpha({ image: img2, alpha: img2 })
                    return img2
                }
                console.log(img.data)
                return this.nodes.Image_Load({
                    image_path: img.url ?? img.absPath,
                    RGBA: 'false',
                    // RGBA: p?.joinImageWithAlpha ? 'true' : 'false', // 'false',
                })
            }
            if (ia.type === 'ComfyImage') {
                const img2 = this.nodes.LoadImage({ image: ia.imageName })
                // const img2 = this.nodes.LoadImage({ image: res.name as any })
                // if (p?.joinImageWithAlpha) return this.nodes.JoinImageWithAlpha({ image: img2, alpha: img2 })
                return img2
            }
            if (ia.type === 'PaintImage') {
                const img2 = this.nodes.Base64ImageInput({ bas64_image: ia.base64 })
                // const img2 = this.nodes.LoadImage({ image: res.name as any })
                // if (p?.joinImageWithAlpha) return this.nodes.JoinImageWithAlpha({ image: img2, alpha: img2 })
                return img2 as any // 🔴
            }
            exhaust(ia)
            // if (ia.type === 'imageSignal') {
            //     const node = this.graph.nodesIndex.get(ia.nodeID)
            //     if (node == null) throw new Error('node is not in current graph')
            //     // 🔴 need runtime checking here
            //     const xx = (node as any)[ia.fieldName]
            //     console.log({ xx })
            //     return xx
            // }
            // if (ia.type === 'imageURL') {
            //     return this.nodes.WASImageLoad({ image_path: ia.url, RGBA: 'false' })
            // }
            throw new Error('FAILURE')
            // return exhaust(ia)
        } catch (err) {
            console.log('🔴 failed to convert ImageAnser to _IMAGE', ia)
            throw err
        }
    }

    private extractString = (message: Printable): string => {
        if (typeof message === 'string') return message
        if (typeof message === 'number') return message.toString()
        if (typeof message === 'boolean') return message.toString()
        if (message instanceof ComfyNodeOutput) return message.toString() // 🔴
        if (typeof message === 'object')
            return `${message.$schema.nameInCushy}_${message.uid}(${JSON.stringify(message.json, null, 2)})`
        return `❌ (impossible to extract string from ${typeof message} / ${(message as any)?.constructor?.name})`
    }

    /** display something in the console */
    print = (message: Printable) => {
        this.output_text(message)
    }

    output_text = (message: Printable) => {
        let msg = this.extractString(message)
        console.info(msg)
        this.step.db.media_texts.create({ kind: 'text', content: msg, stepID: this.step.id })
    }

    /** upload a file from disk to the ComfyUI backend */
    // uploadImgFromDisk = async (path: string): Promise<ComfyUploadImageResult> => {
    //     return this.workspace.uploadImgFromDisk(asRelativePath(path))
    // }

    resolveRelative = (path: string): RelativePath => asRelativePath(path)
    resolveAbsolute = (path: string): AbsolutePath => asAbsolutePath(path)
    range = (start: number, end: number, increment: number = 1): number[] => {
        const res = []
        for (let i = start; i < end; i += increment) res.push(i)
        return res
    }

    // UPLOAD ------------------------------------------------------------------------------------------
    /** upload an image present on disk to ComfyUI */
    upload_FileAtAbsolutePath: Uploader['upload_FileAtAbsolutePath']

    /** upload an image that can be downloaded form a given URL to ComfyUI */
    upload_ImageAtURL: Uploader['upload_ImageAtURL']

    /** upload an image from dataURL */
    upload_dataURL: Uploader['upload_dataURL']

    /** upload a deck asset to ComfyUI */
    upload_Asset: Uploader['upload_Asset']

    /** upload a Blob */
    upload_Blob: Uploader['upload_Blob']

    // LOAD IMAGE --------------------------------------------------------------------------------------
    /** load an image present on disk to ComfyUI */
    load_FileAtAbsolutePath = async (absPath: AbsolutePath): Promise<ImageAndMask> => {
        const res = await this.st.uploader.upload_FileAtAbsolutePath(absPath)
        return this.loadImageAnswer({ type: 'ComfyImage', imageName: res.name })
    }

    /** load an image that can be downloaded form a given URL to ComfyUI */
    load_ImageAtURL = async (url: string): Promise<ImageAndMask> => {
        const res = await this.st.uploader.upload_ImageAtURL(url)
        return this.loadImageAnswer({ type: 'ComfyImage', imageName: res.name })
    }
    /** load an image from dataURL */
    load_dataURL = async (dataURL: string): Promise<ImageAndMask> => {
        const res: ComfyUploadImageResult = await this.st.uploader.upload_dataURL(dataURL)
        // this.st.db.images.create({ infos:  })
        return this.loadImageAnswer({ type: 'ComfyImage', imageName: res.name })
    }

    /** load a deck asset to ComfyUI */
    load_Asset = async (asset: AppPath): Promise<ImageAndMask> => {
        const res = await this.st.uploader.upload_Asset(asset)
        return this.loadImageAnswer({ type: 'ComfyImage', imageName: res.name })
    }
    /** load a Blob */
    load_Blob = async (blob: Blob): Promise<ImageAndMask> => {
        const res = await this.st.uploader.upload_Blob(blob)
        return this.loadImageAnswer({ type: 'ComfyImage', imageName: res.name })
    }

    // INTERRACTIONS ------------------------------------------------------------------------------------------
    async PROMPT(p?: {
        /** defaults to numbers */
        ids?: IDNaminScheemeInPromptSentToComfyUI
    }): Promise<ComfyPromptL> {
        console.info('prompt requested')
        const step = await this.sendPromp(p?.ids ?? 'use_stringified_numbers_only')
        // this.run.cyto.animate()
        await step.finished
        return step
    }

    private _promptCounter = 0
    private sendPromp = async (idMode: IDNaminScheemeInPromptSentToComfyUI): Promise<ComfyPromptL> => {
        const liveGraph = this.workflow
        if (liveGraph == null) throw new Error('no graph')
        const currentJSON = deepCopyNaive(liveGraph.json_forPrompt(idMode))
        const debugWorkflow = await liveGraph.json_workflow()
        // this.step.append({ type: 'prompt', graph: currentJSON })
        console.info('checkpoint:' + JSON.stringify(currentJSON))
        // const step = new PromptExecution(this, currentJSON)
        // this.steps.unshift(step)

        // if we're note really running prompts, just resolve the step and continue
        // if (this.opts?.mock) {
        //     console.info('MOCK => aborting')
        //     step._resolve!(step)
        //     return step
        // }

        // const graphID = asGraphID(nanoid())
        // const graph = this.st.db.graphs.create({ id: graphID, comfyPromptJSON: currentJSON })
        const stepID = this.step.id

        // 🔴 TODO: store the whole project in the prompt
        const out: ApiPromptInput = {
            client_id: this.st.comfySessionId,
            extra_data: { extra_pnginfo: { workflow: debugWorkflow } },
            prompt: currentJSON,
        }

        // | const outputAbsPath = this.st.cacheFolderPath

        // save a copy of the prompt to the cache folder
        // | const promptJSONPath = asAbsolutePath(path.join(outputAbsPath, `prompt-${++this._promptCounter}.json`))
        // | this.st.writeTextFile(promptJSONPath, JSON.stringify(currentJSON, null, 4))

        // save a corresponding workflow file
        // | const cytoJSONPath = asAbsolutePath(path.join(outputAbsPath, `cyto-${this._promptCounter}.json`))
        // | const cytoJSON = await runAutolayout(this.graph)
        // | this.st.writeTextFile(cytoJSONPath, JSON.stringify(cytoJSON, null, 4))

        // save a corresponding workflow file
        // | const workflowJSONPath = asAbsolutePath(path.join(outputAbsPath, `workflow-${this._promptCounter}.json`))
        // | const liteGraphJSON = convertFlowToLiteGraphJSON(this.graph, cytoJSON)
        // | this.st.writeTextFile(workflowJSONPath, JSON.stringify(liteGraphJSON, null, 4))

        // 🔶 not waiting here, because output comes back from somewhere else
        // TODO: but we may want to catch error here to fail early
        // otherwise, we might get stuck
        const promptEndpoint = `${this.st.getServerHostHTTP()}/prompt`
        console.info('sending prompt to ' + promptEndpoint)
        const graph = this.st.db.graphs.create({ comfyPromptJSON: currentJSON })
        const res = await fetch(promptEndpoint, {
            method: 'POST',
            body: JSON.stringify(out),
        })
        const prompmtInfo: PromptInfo = await res.json()
        // console.log('prompt status', res.status, res.statusText, prompmtInfo)
        // this.step.addOutput({ type: 'prompt', promptID: prompmtInfo.prompt_id })
        if (res.status !== 200) {
            const err = new InvalidPromptError('ComfyUI Prompt request failed', graph, prompmtInfo)
            return Promise.reject(err)
        } else {
            const prompt = this.st.db.comfy_prompts.create({
                id: prompmtInfo.prompt_id,
                executed: 0,
                graphID: graph.id,
                stepID,
            })
            // this.step.addOutput({ type: 'prompt', promptID: prompmtInfo.prompt_id })
            return prompt
        }
        // await sleep(1000)
        // return step
    }
}
