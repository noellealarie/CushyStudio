import type { LabelPos } from 'src/controls/IWidget'
import type * as R from 'src/controls/Widget'

import { observer } from 'mobx-react-lite'

import { ErrorBoundary } from 'react-error-boundary'
import { Toggle, Tooltip, Whisper } from 'src/rsuite/shims'
import { useSt } from 'src/state/stateContext'
import { ErrorBoundaryFallback } from '../../widgets/misc/ErrorBoundary'
import { WidgetDI } from '../widgets/WidgetUI.DI'
import { makeLabelFromFieldName } from '../../utils/misc/makeLabelFromFieldName'
import { RevealUI } from 'src/rsuite/RevealUI'
import { ChangeEvent } from 'react'
import { isWidgetCollapsible } from './isWidgetCollapsible'

export const WidgetWithLabelUI = observer(function WidgetWithLabelUI_(p: {
    req: R.Widget
    labelPos?: LabelPos
    rootKey: string
    vertical?: boolean
    isTopLevel?: boolean
}) {
    const { rootKey, req } = p
    const KLS = WidgetDI
    const st = useSt()

    let tooltip: Maybe<string> = req.input.tooltip
    let label: Maybe<string> = req.input.label ?? makeLabelFromFieldName(rootKey)

    const isVertical = (() => {
        if (st.preferedFormLayout === 'auto') {
            if (req instanceof KLS.Widget_group) return true
            if (req instanceof KLS.Widget_groupOpt) return true
            if (req instanceof KLS.Widget_list) return true
            if (req instanceof KLS.Widget_listExt) return true
            if (req instanceof KLS.Widget_str && req.input.textarea) return true
            return false
        }
        if (st.preferedFormLayout === 'mobile') return true
        if (st.preferedFormLayout === 'dense') return false
    })()

    const isCollapsible = isWidgetCollapsible(req)
    const collapsed = req.state.collapsed && isCollapsible
    const v = p.req
    const levelClass = p.isTopLevel ? '_isTopLevel' : '_isNotTopLevel'

    const toggleInfo =
        req instanceof KLS.Widget_bool
            ? {
                  value: req.state.val,
                  onChange: (ev: ChangeEvent<HTMLInputElement>) => {
                      req.state.val = ev.target.checked
                      req.state.active = true
                  },
              }
            : {
                  value: req.state.active,
                  onChange: (ev: ChangeEvent<HTMLInputElement>) => {
                      req.state.active = ev.target.checked
                  },
              }
    const showToogle = req.isOptional || !req.state.active || req instanceof KLS.Widget_bool

    let WIDGET = collapsed ? null : !v.state.active ? null : ( //
        <ErrorBoundary FallbackComponent={ErrorBoundaryFallback} onReset={(details) => {}}>
            <WidgetDI.WidgetUI req={req} />
        </ErrorBoundary>
    )

    const LABEL = (
        <div
            tw={[
                '_WidgetLabel',
                isVertical ? 'w-full' : null,
                WIDGET == null ? 'w-full' : null,
                'min-w-max shrink-0',
                'flex items-center gap-1',
                'hover:bg-base-200 cursor-pointer',
            ]}
            onClick={() => {
                if (v.state.collapsed) return (v.state.collapsed = false)
                if (!isCollapsible) return
                if (!v.state.active) return
                v.state.collapsed = true
            }}
        >
            {showToogle && (
                <Toggle
                    color='green'
                    checked={toggleInfo.value}
                    onChange={toggleInfo.onChange}
                    onClick={(ev) => ev.stopPropagation()}
                />
            )}
            {tooltip && (
                <RevealUI>
                    <span className='material-symbols-outlined'>info</span>
                    <Tooltip>{tooltip}</Tooltip>
                </RevealUI>
            )}
            <span
                //
                tw={[p.isTopLevel ? 'font-bold' : undefined]}
                style={
                    true && !isVertical //
                        ? { lineHeight: '2rem', display: 'inline-block' }
                        : { lineHeight: '2rem' }
                }
            >
                {label || '...'}
            </span>{' '}
            <span tw='opacity-30 hover:opacity-100'>{v.state.collapsed ? '▸ {...}' : /*'▿'*/ ''}</span>
        </div>
    )

    let className = isVertical //
        ? `_WidgetWithLabelUI ${levelClass} flex flex-col items-baseline`
        : `_WidgetWithLabelUI ${levelClass} flex flex-row ${isCollapsible ? 'items-baseline' : 'items-center'} gap-1`

    if (WIDGET == null) className += ' w-full'
    if (isVertical && WIDGET) {
        WIDGET = (
            <div tw='w-full' style={{ padding: '0 0rem 0 2rem' }}>
                {WIDGET}
            </div>
        )
    }
    if (p.labelPos === 'end') {
        return (
            <div className={className} key={rootKey}>
                {WIDGET}
                {LABEL}
            </div>
        )
    } else {
        return (
            <div className={className} key={rootKey}>
                {LABEL}
                {WIDGET}
            </div>
        )
    }
})
