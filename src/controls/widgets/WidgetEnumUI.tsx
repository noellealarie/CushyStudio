import { observer } from 'mobx-react-lite'
import { Widget_enum, Widget_enumOpt } from 'src/controls/Widget'
import { Popover, SelectPicker, Whisper } from 'src/rsuite/shims'
import { useSt } from 'src/state/stateContext'
import { CleanedEnumResult } from 'src/types/EnumUtils'
import type { EnumName, EnumValue } from '../../models/Schema'
import { AutoCompleteSelect } from 'src/rsuite/select'

type T = {
    label: EnumValue
    value: EnumValue | null
}[]

export const WidgetEnumUI = observer(function WidgetEnumUI_<K extends KnownEnumNames>(p: {
    req: Widget_enum<K> | Widget_enumOpt<K>
}) {
    const req = p.req
    const enumName = req.input.enumName
    const isOptional = req instanceof Widget_enumOpt
    const value = req.state.val as any
    return (
        <EnumSelectorUI
            value={value}
            disabled={!req.state.active}
            isOptional={isOptional}
            enumName={enumName}
            // substituteValue={req.status}
            onChange={(e) => {
                if (e == null) {
                    if (isOptional) req.state.active = false
                    return
                }
                req.state.val = e as any // 🔴
            }}
        />
    )
})

export const EnumSelectorUI = observer(function EnumSelectorUI_(p: {
    isOptional: boolean
    value: CleanedEnumResult<any>
    // substituteValue?: EnumValue | null
    onChange: (v: EnumValue | null) => void
    disabled?: boolean
    enumName: EnumName
}) {
    const project = useSt().getProject()
    const schema = project.schema
    type T = { asOptionLabel: string; value: EnumValue }
    const options: T[] = schema.getEnumOptionsForSelectPicker(p.enumName)
    // const valueIsValid = (p.value != null || p.isOptional) && options.some((x) => x.value === p.value)
    const hasError = Boolean(p.value.isSubstitute || p.value.ENUM_HAS_NO_VALUES)
    return (
        <div>
            <div>
                <AutoCompleteSelect //
                    tw={[{ ['rsx-field-error']: hasError }]}
                    size='sm'
                    disabled={p.disabled}
                    cleanable={p.isOptional}
                    options={options}
                    value={p.value.candidateValue}
                    // rendierValue={(v) => {
                    //     if (v === true) return '🟢 true'
                    //     if (v === false) return '❌ false'
                    //     return v
                    // }}
                    // renderMenuItem={(v) => {
                    //     if (v === true) return '🟢 true'
                    //     if (v === false) return '❌ false'
                    //     return v
                    // }}
                    onChange={(e) => {
                        if (e.selectedOption == null) return
                        p.onChange(e.selectedOption.value)
                    }}
                />
            </div>
            <div tw='flex flex-wrap gap-2'>
                {p.value.isSubstitute ? ( //
                    <Whisper
                        enterable
                        placement='bottom'
                        speaker={
                            <Popover>
                                <span>
                                    <span tw='bord'>{p.value.candidateValue}</span> is not in your ComfyUI setup
                                </span>
                                <div>
                                    <span tw='bord'>{p.value.finalValue}</span> used instead
                                </div>
                            </Popover>
                        }
                    >
                        <div className='text-orange-500 flex items-center'>
                            <span className='material-symbols-outlined'>info</span>
                            <span>{p.value.finalValue}</span>
                        </div>
                    </Whisper>
                ) : null}
                {p.value.ENUM_HAS_NO_VALUES ? <div tw='text-red-500'>ENUM HAS NO VALUE</div> : null}
            </div>
        </div>
    )
})
