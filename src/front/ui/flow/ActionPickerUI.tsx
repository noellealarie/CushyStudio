import { observer } from 'mobx-react-lite'
import { Button, SelectPicker } from 'rsuite'
import { ActionL } from 'src/models/Action'
import { useSt } from '../../FrontStateCtx'

export const ActionPickerUI = observer(function ActionPickerUI_(p: { action: ActionL }) {
    const st = useSt()
    const action = p.action
    const tools = st.actionsSorted
    const currentToolID = action.tool.id
    return (
        <div className='flex gap-1 items-baseline'>
            <SelectPicker
                //
                data={tools}
                labelKey='name'
                valueKey='id'
                value={action.data.toolID}
                onChange={(v) => action.update({ toolID: v })}
            />
            {action.data.toolID == null ? (
                <>
                    suggestions:
                    <div className='flex flex-col'>
                        {st.actionsSorted.slice(0, 3 /* 🔴 */).map((a) => {
                            return (
                                <Button
                                    key={a.id}
                                    size='xs'
                                    appearance='link'
                                    // appearance={currentToolID === a.id ? 'primary' : 'ghost'}
                                    color={currentToolID === a.id ? 'green' : undefined}
                                    onClick={() => action.update({ toolID: a.id })}
                                >
                                    <div>{a.data.name}</div>
                                </Button>
                            )
                        })}
                    </div>
                </>
            ) : null}
        </div>
    )
})
