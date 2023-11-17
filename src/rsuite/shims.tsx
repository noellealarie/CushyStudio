import { observer } from 'mobx-react-lite'
import { ReactNode } from 'react'

export type PositionChildProps = {
    top: number
    left: number
    className: string
}
export type ItemDataType = {
    value: string
    children?: ItemDataType[]
    label: string
}

export type RSColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue'
export type RSSize = 'sm' | 'xs' | 'md' | 'lg'
export type RSAppearance = 'default' | 'subtle' | 'ghost' | 'link' | 'primary'
export type TypeAttributes = {
    Color: RSColor
    Size: RSSize
    Appearance: RSAppearance
}
// form
export const Form = (p: any) => <div {...p}></div>
export const FormHelpText = (p: any) => <div {...p}></div>
export const FormControlLabel = (p: JSX.IntrinsicElements['label']) => <label {...p}></label>
export const FormControl = (p: JSX.IntrinsicElements['input']) => <input tw='input input-sm' {...p}></input>
export const Joined = (p: { children?: ReactNode }) => <div tw='border border-neutral join' {...p}></div>

export const Addon = observer(function Addon_(p: any) {
    return <div tw='flex items-center px-2 join-item' {...p}></div>
})

// inputs
export const Button = (
    p: JSX.IntrinsicElements['button'] & {
        icon?: Maybe<ReactNode>
        active?: Maybe<boolean>
        size?: Maybe<RSSize>
        loading?: boolean
        disabled?: boolean
        appearance?: Maybe<RSAppearance>
    },
) => (
    <button
        {...p}
        tw={[
            'btn',
            p.loading || p.disabled ? 'btn-disabled' : null,
            p.active ? 'btn-active' : null,
            p.appearance
                ? (() => {
                      if (p.appearance === 'primary') return 'btn-primary'
                      if (p.appearance === 'ghost') return 'btn-outline'
                      if (p.appearance === 'link') return 'btn-link'
                      if (p.appearance === 'default') return null
                      if (p.appearance === 'subtle') return null
                      return exhaust(p.appearance)
                  })()
                : null,
            p.size
                ? (() => {
                      if (p.size === 'sm') return 'btn-sm'
                      if (p.size === 'xs') return 'btn-xs'
                      if (p.size === 'lg') return 'btn-lg'
                      if (p.size === 'md') return null
                      return exhaust(p.size)
                  })()
                : null,
            ...(p?.tw ?? []),
        ]}
    >
        {p.icon}
        {p.children}
    </button>
)

export const Input = (p: JSX.IntrinsicElements['input']) => (
    <input //
        {...p}
    ></input>
)
export const InputNumberBase = observer(function InputNumberBase_(
    //
    p: JSX.IntrinsicElements['input'] & { _size?: RSSize },
) {
    const sizeClass = p._size ? `input-${p._size}` : null
    return (
        <input //
            type='number'
            tw={['input input-sm', sizeClass]}
            {...p}
        ></input>
    )
})

export const Slider = observer(function Slider_(p: JSX.IntrinsicElements['input']) {
    return (
        <input //
            type='range'
            {...p}
            tw={['range range-secondary']}
        ></input>
    )
})

export const Radio = observer(function Radio_(p: JSX.IntrinsicElements['input']) {
    return (
        <input //
            type='radio'
            {...p}
        ></input>
    )
})

export const Toggle = observer(function Toggle_(p: JSX.IntrinsicElements['input']) {
    return (
        <input //
            type='checkbox'
            {...p}
            tw={[
                //
                'toggle toggle-primary',
                // p.checked && 'toggle-success',
            ]}
        ></input>
    )
})

export const SelectPicker = (p: any) => <select {...p}></select>
export const TagPicker = (p: any) => <select multiple {...p}></select>
export const MultiCascader = (p: any) => <select multiple {...p}></select>
export const Tree = (p: any) => <div {...p}></div>

// https://daisyui.com/components/rating/#mask-star-2-with-warning-color
export const Rate = (p: {
    //
    value?: number
    name: string
    onChange?: (value: number) => void
}) => (
    <div tw='rating rating-md rating-sm '>
        {[1, 2, 3, 4, 5].map((ix) => (
            <input
                key={ix}
                name={p.name}
                checked={p.value === ix}
                onChange={() => p.onChange?.(ix)}
                type='radio'
                tw='mask mask-star fade-in-40 bg-orange-400'
            />
        ))}
    </div>
)

// tooltips
export const Whisper = (p: any) => <div {...p}></div>
export const Speaker = (p: any) => <div {...p}></div>
export const Popover = (p: any) => <div {...p}></div>
export const Tooltip = (p: any) => <div {...p}></div>
// modals
export const Modal = (p: any) => <div {...p}></div>
export const ModalHeader = (p: any) => <div {...p}></div>
export const ModalTitle = (p: any) => <div {...p}></div>
export const ModalBody = (p: any) => <div {...p}></div>
export const ModalFooter = (p: any) => <div {...p}></div>
// navs
export const NavItem = (p: any) => <div {...p}></div>
// menus
export const Menu = (p: any) => <div {...p}></div>
export const MenuBar = (p: any) => <div {...p} />
export const Dropdown = (p: {
    style?: React.CSSProperties
    className?: string
    startIcon?: Maybe<ReactNode>
    title: ReactNode
    appearance?: Maybe<RSAppearance>
    size?: Maybe<RSSize>
    children: ReactNode
}) => (
    <div style={p.style} className='dropdown' tw={[p.className]}>
        <label tabIndex={0} tw={[`btn btn-${p.size ?? 'sm'}`]}>
            {p.startIcon} {p.title}
        </label>
        <ul tabIndex={0} tw='p-2 shadow menu dropdown-content z-[1] bg-base-100 rounded-box w-52'>
            {p.children}
        </ul>
    </div>
)
export const DropdownMenu = (p: any) => <div {...p}></div>

export const DropdownItem = observer(function DropdownItem_(p: {
    onClick?: () => void
    size?: RSSize
    icon?: Maybe<ReactNode>
    children?: ReactNode
    active?: boolean
    className?: string
}) {
    const { size, icon, children, active, ...rest } = p

    return (
        <li {...rest} tw={[active && 'bg-accent text-accent-content']}>
            <div className='flex items-center gap-2'>
                {p.icon ?? <span className='material-symbols-outlined'>spa</span>}
                {p.children}
            </div>
        </li>
    )
})
// misc
export const Panel = (p: any) => (
    <div
        //
        // style={{ border: '1px solid #404040' }}
        tw='p-2 input-bordered'
        {...p}
    ></div>
)
export const Progress = (p: any) => <div {...p}></div>
export const ProgressLine = (p: any) => <div {...p}></div>
export const Message = observer(function Message_(p: {
    //
    type: 'error' | 'info'
    header?: ReactNode
    showIcon?: boolean
    children?: ReactNode
}) {
    return (
        <div
            tw={[
                p.type === 'error' //
                    ? 'bg-error text-error-content'
                    : 'bg-base text-primary-content',
            ]}
            {...p}
        >
            {p.header}
            {p.children}
        </div>
    )
})
export const Tag = (p: any) => <div {...p}></div>

export const Loader = observer((p: { size?: RSSize; className?: string }) => (
    <span
        //
        className={p.className}
        tw={[`loading loading-spinner loading-${p.size ?? 'sm'}`]}
    ></span>
))

// misc 2
export const RadioTile = (p: any) => <div {...p}></div>
