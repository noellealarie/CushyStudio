import { makeAutoObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import { Widget_size } from 'src/controls/Widget'
import { InputNumberUI } from 'src/rsuite/InputNumberUI'
import { Joined, Toggle } from 'src/rsuite/shims'
import { parseFloatNoRoundingErr } from 'src/utils/misc/parseFloatNoRoundingErr'

type ModelType = 'xl' | '1.5' | 'custom'
type AspectRatio = '1:1' | '16:9' | '4:3' | '3:2' | 'custom'

export const WigetSizeUI = observer(function WigetSizeUI_(p: { req: Widget_size }) {
    return (
        <WigetSizeXUI //
            size={p.req.state}
            bounds={p.req.input}
        />
    )
})

type SizeAble = {
    width: number
    height: number
    min?: number
    max?: number
    step?: number
}
export const WigetSizeXUI = observer(function WigetSizeXUI_(p: {
    //
    size: SizeAble
    bounds?: {
        min?: number
        max?: number
        step?: number
    }
}) {
    const uist = useMemo(() => new ResolutionState(p.size), [])

    const resoBtn = (ar: AspectRatio) => (
        <button
            type='button'
            tw={['btn btn-sm join-item btn-ghost', uist.desiredAspectRatio === ar && 'btn-active']}
            onClick={() => uist.setAspectRatio(ar)}
        >
            {ar}
        </button>
    )

    const modelBtn = (model: ModelType) => (
        <button
            type='button'
            tw={['btn btn-sm join-item', uist.desiredModelType === model && 'btn-active']}
            onClick={() => uist.setModelType(model)}
        >
            {model}
        </button>
    )

    return (
        <div className='flex items-center flex-wrap space-x-2'>
            <div className='flex flex-col gap-1'>
                <div tw='flex'>
                    <div tw='w-12'>Width</div>
                    <InputNumberUI
                        //
                        min={p.bounds?.min ?? 128}
                        max={p.bounds?.max ?? 4096}
                        step={p.bounds?.step ?? 256}
                        mode='int'
                        tw='join-item'
                        value={uist.width}
                        onValueChange={(next) => uist.setWidth(next)}
                        // hideSlider
                    />
                </div>
                <div tw='flex'>
                    <div tw='w-12'>Height</div>
                    <InputNumberUI
                        //
                        tw='join-item'
                        min={p.bounds?.min ?? 128}
                        max={p.bounds?.max ?? 4096}
                        step={p.bounds?.step ?? 256}
                        mode='int'
                        value={uist.height}
                        onValueChange={(next) => uist.setHeight(next)}
                        // hideSlider
                    />
                </div>
            </div>
            {/* {JSON.stringify(uist.width)}x{JSON.stringify(uist.height)} */}
            <div tw='flex flex-col gap-1'>
                <div tw='flex items-centered gap-1'>
                    <Joined>
                        {modelBtn('1.5')}
                        {modelBtn('xl')}
                    </Joined>

                    <div tw='flex items-center'>
                        filp:
                        <Toggle
                            //
                            checked={uist.flip}
                            onChange={(ev) => (uist.flip = ev.target.checked)}
                        />
                    </div>
                </div>
                <Joined>
                    {resoBtn('1:1')}
                    {resoBtn('16:9')}
                    {resoBtn('4:3')}
                    {resoBtn('3:2')}
                    <button
                        type='button'
                        tw={['btn btn-sm join-item', uist.desiredAspectRatio === 'custom' && 'btn-active']}
                        onClick={() => uist.setAspectRatio('custom')}
                    >
                        ?
                    </button>
                </Joined>
            </div>
            <div tw='bg-primary' style={{ width: '2rem', height: `${(uist.height / uist.width) * 2}rem` }}></div>
            {/* <select value={uist.desiredAspectRatio} onChange={(e) => uist.setAspectRatio(e.target.value as AspectRatio)}>
                <option value='1:1'>1:1</option>
                <option value='16:9'>16:9</option>
                <option value='4:3'>4:3</option>
                <option value='3:2'>3:2</option>
                <option value='custom'>Custom</option>
            </select> */}
        </div>
    )
})

class ResolutionState {
    private idealSizeforModelType = (model: ModelType | string) => {
        if (model === 'xl') return { width: 1024, height: 1024 }
        if (model === '2.0') return { width: 768, height: 768 }
        if (model === '2.1') return { width: 768, height: 768 }
        if (model === '1.5') return { width: 512, height: 512 }
        if (model === '1.4') return { width: 512, height: 512 }
        return { width: this.width, height: this.height }
    }
    _flip: boolean = false
    get flip(): boolean {
        return this._flip
    }
    set flip(next: boolean) {
        const same = this._flip === next
        if (same) return
        this._flip = next
        const prevWidth = this.width
        const prevHeight = this.height
        this.width = prevHeight
        this.height = prevWidth
    }
    get width(): number {
        return this.req.width
    }
    get height(): number {
        return this.req.height
    }
    set width(next: number) {
        this.req.width = next
    }
    set height(next: number) {
        this.req.height = next
    }

    desiredModelType: ModelType = '1.5'
    desiredAspectRatio: AspectRatio = 'custom'

    constructor(public req: SizeAble) {
        makeAutoObservable(this)

        this.desiredAspectRatio = (() => {
            const ratio = parseFloatNoRoundingErr(this.realAspectRatio, 2)
            // console.log(ratio, parseFloatNoRoundingErr(16 / 9, 2))
            if (ratio === parseFloatNoRoundingErr(1 / 1, 2)) return '1:1'
            if (ratio === parseFloatNoRoundingErr(16 / 9, 2)) return '16:9'
            if (ratio === parseFloatNoRoundingErr(4 / 3, 2)) return '4:3'
            if (ratio === parseFloatNoRoundingErr(3 / 2, 2)) return '3:2'
            return 'custom'
        })()
    }

    setWidth(width: number) {
        this.width = width
        if (this.desiredAspectRatio !== 'custom') {
            this.updateHeightBasedOnAspectRatio()
        }
    }

    setHeight(height: number) {
        this.height = height
        if (this.desiredAspectRatio !== 'custom') {
            this.updateWidthBasedOnAspectRatio()
        }
    }

    get realAspectRatio() {
        return this.width / this.height
    }
    setModelType(modelType: ModelType) {
        this.desiredModelType = modelType
        // const currentAspect = this.width / this.height
        const itgt = this.idealSizeforModelType(modelType)
        const diagPrev = Math.sqrt(this.width ** 2 + this.height ** 2)
        const diagNext = Math.sqrt(itgt.width ** 2 + itgt.height ** 2)
        const factor = diagNext / diagPrev
        console.log({ modelType, idealTarget: itgt, avg: diagPrev, avg2: diagNext, factor })
        this.width = Math.round(this.width * factor)
        this.height = Math.round(this.height * factor)
        console.log(`final is w=${this.width} x h=${this.height}`)
        console.log(`fixed avg is ${Math.sqrt(this.width ** 2 + this.height ** 2)}`)
    }

    setAspectRatio(aspectRatio: AspectRatio) {
        this.desiredAspectRatio = aspectRatio
        if (aspectRatio !== 'custom') this.updateWidthBasedOnAspectRatio()
        this.setModelType(this.desiredModelType)
    }

    private updateHeightBasedOnAspectRatio() {
        const [widthRatio, heightRatio] = this.desiredAspectRatio.split(':').map(Number)
        this.height = Math.round(this.width * (heightRatio / widthRatio))
    }

    private updateWidthBasedOnAspectRatio() {
        const [widthRatio, heightRatio] = this.desiredAspectRatio.split(':').map(Number)
        this.width = Math.round(this.height * (widthRatio / heightRatio))
    }
}
