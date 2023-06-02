import { observer } from 'mobx-react-lite'
import { Button, SelectPicker } from 'rsuite'
import { ActionL } from 'src/models/Action'
import { useSt } from '../../FrontStateCtx'

export const ActionPickerUI = observer(function ActionPickerUI_(p: { action: ActionL }) {
    const st = useSt()
    const action = p.action
    const tools = st.actionsSorted
    return (
        <>
            <SelectPicker
                //
                data={tools}
                labelKey='name'
                valueKey='id'
                value={action.data.toolID}
                onChange={(v) => action.update({ toolID: v })}
            />
        </>
    )
})

export const ActionSuggestionUI = observer(function ActionSuggestionUI_(p: { action: ActionL }) {
    const st = useSt()
    const action = p.action
    if (action.tool.id != null) return null
    return (
        <div className='flex gap-1 items-baseline'>
            suggestions:
            {action.data.toolID == null
                ? st.actionsSorted.slice(0, 3 /* 🔴 */).map((a) => {
                      return (
                          <Button key={a.id} size='xs' appearance='ghost' onClick={() => action.update({ toolID: a.id })}>
                              <div>{a.data.name}</div>
                          </Button>
                      )
                  })
                : null}
        </div>
    )
})
