import type { FolderL } from 'src/models/Folder'

import { observer } from 'mobx-react-lite'
import { Button, IconButton } from 'rsuite'
import { useSt } from '../../FrontStateCtx'
import { GalleryFolderUI } from './GalleryFolderUI'
import { GalleryImageUI, PlaceholderImageUI } from './GalleryImageUI'
import * as I from '@rsuite/icons'

export const VerticalGalleryUI = observer(function VerticalGalleryUI_(p: {}) {
    const st = useSt()

    return (
        <div className='flex-col flex'>
            <div className='flex bg-gray-950'>
                {/* MAIN IMAGE COLUMN */}
                <div className='flex flex-col-reverse' style={{ overflowX: 'auto' }}>
                    <PlaceholderImageUI />
                    {st.imageReversed.map((img, ix) => (
                        <GalleryImageUI key={ix} img={img} />
                    ))}
                    <IconButton disabled icon={<I.Close />} size='xs' appearance='link'></IconButton>
                </div>
                {/*  EXTRA FOLDERS */}
                {st.db.folders.map((v: FolderL) => {
                    return (
                        <GalleryFolderUI //
                            direction='vertical'
                            key={v.id}
                            folder={v}
                        />
                    )
                })}
            </div>
        </div>
    )
})
