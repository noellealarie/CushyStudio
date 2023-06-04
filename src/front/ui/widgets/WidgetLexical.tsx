import { $getRoot, $getSelection, EditorState, LexicalEditor } from 'lexical'
import { useEffect } from 'react'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import * as TH from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { observer } from 'mobx-react-lite'
import EmojiPickerPlugin from './WidgetLexicalEmoji'
import theme from './WidgetLexicalTheme'

// const theme = {
//     // Theme styling goes here
//     // ...
// }

// When the editor changes, you can get notified via the
// LexicalOnChangePlugin!
function onChange(p: EditorProps, editorState: EditorState) {
    editorState.read(() => {
        // Read the contents of the EditorState here.
        const root = $getRoot()
        const selection = $getSelection()
        const txt = root.__cachedText
        if (txt) p.set(txt)
        console.log(root, selection)
    })
}

// Lexical React plugins are React components, which makes them
// highly composable. Furthermore, you can lazy load plugins if
// desired, so you don't pay the cost for plugins until you
// actually use them.
function MyCustomAutoFocusPlugin() {
    const [editor] = useLexicalComposerContext()

    useEffect(() => {
        // Focus the editor when the effect fires!
        editor.focus()
    }, [editor])

    return null
}

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
    console.error(error)
}

type EditorProps = {
    get: () => string
    set: (v: string) => void
    nullable?: boolean
    textarea?: boolean
}

export const EditorUI = observer((p: EditorProps) => {
    const initialConfig = {
        namespace: 'MyEditor',
        theme: theme,
        onError,
    }

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <PlainTextPlugin
                contentEditable={
                    <ContentEditable
                        //
                        className='border border-gray-500 [min-width:8rem]'
                    />
                }
                placeholder={<div>Enter some text...</div>}
                ErrorBoundary={LexicalErrorBoundary}
            />
            {/* https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/EmojiPickerPlugin/index.tsx */}
            <EmojiPickerPlugin />
            <OnChangePlugin
                onChange={(editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => {
                    onChange(p, editorState)
                    // console.log(editorState, editor, tags)
                    // p.set(editorState.)
                }}
            />
            <HistoryPlugin />
            <MyCustomAutoFocusPlugin />
        </LexicalComposer>
    )
})
