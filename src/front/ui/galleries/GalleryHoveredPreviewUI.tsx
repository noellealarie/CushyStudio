import { observer } from 'mobx-react-lite'
import { useDragLayer } from 'react-dnd'
import { useSt } from '../../FrontStateCtx'

export const GalleryHoveredPreviewUI = observer(function GalleryHoveredPreviewUI_(p: {}) {
    const st = useSt()
    const cccP = useDragLayer((monitor) => {
        if (monitor.isDragging()) return true
        return false
    })
    if (cccP) return null
    if (st.hovered == null) return null
    return (
        <div>
            {/* BACKDROP */}
            {/* <div
                style={{
                    pointerEvents: 'none',
                    zIndex: 999998,
                    position: 'absolute',
                    inset: 0,
                    bottom: 0,
                    top: 0,
                    left: 0,
                    right: 0,
                    background: '#272727aa',
                }}
            ></div> */}
            {/* OVERLAY CONTAINER */}
            <div
                style={{
                    boxShadow: '0 0 1rem 0 #ebebebe0',
                    pointerEvents: 'none',
                    top: '5rem',
                    left: '5rem',
                    position: 'absolute',
                    zIndex: 999999,
                    objectFit: 'contain',
                    maxHeight: '100vh',
                    // background: 'red',
                    maxWidth: '100vw',
                }}
            >
                {/* METADATA */}
                {/* <div>
                    {st.hovered.prompt.id}
                    <div>downloaded: {st.hovered.data.downloaded ? '✅' : '❌'}</div>
                    <div>{st.hovered.data.imageInfos?.filename ?? 'error'}</div>
                    <div>fpath: {st.hovered.localAbsolutePath}</div>
                </div> */}

                {/* IMAGE */}
                <img
                    src={st.hovered.url}
                    style={{
                        objectFit: 'contain',
                        maxHeight: 'calc(100vh - 10rem)',
                        maxWidth: 'calc(100vw - 10rem)',
                    }}
                />
            </div>
        </div>
    )
})
