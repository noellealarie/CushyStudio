import { _createTable } from './_createTable'

export const _checkAllMigrationsHaveDifferentIds = () => {
    // check all migrations have different IDS
    const ids = new Set()
    for (const migration of migrations) {
        if (ids.has(migration.id)) throw new Error(`duplicate migration id: ${migration.id}`)
        ids.add(migration.id)
    }
}

// ------------------------------------------------------------------------------------
export const migrations: {
    id: string
    name: string
    up: string | string[] // | (() => void)
}[] = [
    {
        id: '1b5eb947',
        name: 'create users table',
        up: `--sql
            create table users (
                id           integer primary key,
                firstName    text    not null,
                lastName     text    not null,
                email        text    not null unique,
                passwordHash text    not null
            );`,
    },
    {
        id: 'UA2XmUXnK9',
        name: 'create graph table',
        up: _createTable('graph', [`comfyPromptJSON json not null`]),
    },
    {
        id: 'lRtCJxvumg',
        name: 'create misc tables',
        up: [
            _createTable('draft', [
                //
                `title          text`,
                `appPath        text                           not null`,
                `appParams      json                           not null`,
                // `graphID        text                           not null`,
            ]),
            _createTable('project', [
                //
                `name           text`,
                `rootGraphID    text    references graph(id)   not null`,
                `currentApp     text`,
                `currentDraftID text    references draft(id)`,
            ]),
            _createTable('step', [
                //
                `name           text`,
                `appPath        text                           not null`,
                `formResult     json                           not null`,
                `formSerial     json                           not null`,
                // `parentGraphID  text     references graph(id)  not null`,
                `outputGraphID  text     references graph(id)  not null`,
                'status         text                           not null',
            ]),
            _createTable('comfy_prompt', [
                //
                `stepID         text     references step(id)   not null`,
                `graphID        text     references graph(id)  not null`,
                'executed       int                            not null default 0',
                'error          json', // execution error
            ]),
            _createTable('comfy_schema', [
                //
                'spec           json                             not null',
                'embeddings     json                             not null',
            ]),
        ],
    },
    {
        id: 'OHwk_shY_c',
        name: 'create misc tables',
        up: [
            //
            // markdown / html / text
            _createTable('media_text', [
                //
                `kind text not null`,
                `content text not null`,
                `stepID text references step(id)`,
            ]),
            _createTable('media_video', [
                //
                `absPath text`,
            ]),
            _createTable('media_image', [
                //
                `base64URL text`,
            ]),
            _createTable('media_3d_displacement', [
                `width     int`,
                `height    int`,
                `image     text`,
                `depthMap  text`,
                `normalMap text`,
                //
                // `base64URL text`,
            ]),
        ],
    },
    {
        id: 'whR8E1Uh05',
        name: 'fix image',
        up: [
            `alter table media_image add column width int`,
            `alter table media_image add column height int`,
            `alter table media_image add column star int`,
            `alter table media_image add column infos json`,
        ],
    },
    {
        id: 'PONTSFSpA_',
        name: 'fix image2',
        up: [`alter table media_image drop column base64URL`],
    },
    {
        id: 'R1lQ0YLIqO',
        name: 'add promptID to image',
        up: [
            //
            `alter table media_image add column promptID text references comfy_prompt(id)`,
            `alter table media_image add column stepID   text references step(id)`,
        ],
    },
    {
        id: 'x8cqAoMEvu',
        name: 'add runtime error',
        up: [
            _createTable('runtime_error', [
                'message text not null',
                'infos json not null',
                'promptID text references comfy_prompt(id)',
                'graphID text references graph(id)',
            ]),
        ],
    },
    {
        id: '0D1XHSH0Dk',
        name: 'add runtime error',
        up: ['alter table runtime_error add column stepID text references step(id)'],
    },
    {
        id: 'oOzhdq3rM2',
        name: 'add step and prompt to video',
        up: [
            //
            'alter table media_video add column stepID text references step(id)',
            'alter table media_video add column promptID text references comfy_prompt(id)',
        ],
    },
    {
        id: 'isTECbxy71',
        name: 'add step and prompt to video',
        up: [
            //
            'alter table media_3d_displacement add column stepID text references step(id)',
            'alter table media_3d_displacement add column promptID text references comfy_prompt(id)',
        ],
    },
    {
        id: 'XXDvvMf4Eu',
        name: 'add step and graph',
        up: ['alter table graph add column stepID text references step(id)'],
    },
    {
        id: '4cjq8_0hGP',
        name: 'add gaussian splat support',
        up: [_createTable('media_splat', [`stepID text references step(id)`])],
    },
    {
        id: '-apJ3x9uB4',
        name: 'add gaussian splat support',
        up: [`alter table media_splat add column url text not null`],
    },
    // {
    //     id: 'PONTSFSpA_',
    //     name: 'fix image2',
    //     up: [`alter table media_image drop column base64URL`],
    // },
]
