import { default as BetterSqlite3 } from 'better-sqlite3'
import { writeFileSync } from 'fs'
import { _getAllColumnsForTable } from './_getAllColumnsForTable'
import { _getAllForeignKeysForTable } from './_getAllForeignKeysForTable'

export const _printSchema = (store: {
    //
    db: BetterSqlite3.Database
    log: (...res: any[]) => void
}) => {
    const db = store.db

    let out1 = ''
    out1 += `import * as T from './TYPES_json'\n`
    out1 += `import { Type } from '@sinclair/typebox'\n`
    out1 += `\n`

    let out2 = `` // global typedef
    // let out3 = '' // schema

    // 1. get all tables
    const stmt = db.prepare(`select name from sqlite_master where type='table'`)
    const tables = stmt.all() as { name: string }[]
    store.log(`found tables ${tables.map((r) => r.name)}`)

    for (const table of tables) {
        const jsTableName = convertTableNameToJSName(table.name)
        const fks = _getAllForeignKeysForTable(db, table.name)
        const cols = _getAllColumnsForTable(db, table.name)

        //

        let typeDecl: string = '\n'
        let schemaDecl: string = `\n`
        out2 += `declare type ${jsTableName}ID = Branded<string, { ${jsTableName}ID: true }>\n`
        typeDecl += `export const as${jsTableName}ID = (s: string): ${jsTableName}ID => s as any\n`
        schemaDecl = `export const ${jsTableName}Schema = Type.Object({\n`
        typeDecl += `export type ${jsTableName}T = {\n`
        for (const col of cols) {
            const comment = `/** @default: ${JSON.stringify(col.dflt_value) ?? 'null'}, sqlType: ${col.type} */`

            const fieldType = (() => {
                // foreign keys
                const hasFK = fks.find((fk) => fk.from === col.name)
                if (hasFK != null) return `${convertTableNameToJSName(hasFK.table)}ID`
                // custom cases
                if (col.name === 'id') return `${jsTableName}ID`
                if (col.name === 'appPath') return `AppPath`
                // by types
                if (col.type === 'INT') return 'number'
                if (col.type === 'INTEGER') return 'number'
                if (col.type === 'TEXT') return 'string'
                if (col.type === 'string') return 'string'
                if (col.type === 'json') return `T.${jsTableName}_${col.name}`
                throw new Error(`unknown type '${col.type}' in ${jsTableName}.${col.name}`)
            })()

            const schemaField = (() => {
                // foreign keys
                if (fks.find((fk) => fk.from === col.name)) return `Type.String()`
                // by types
                if (col.type === 'INT') return 'Type.Number()'
                if (col.type === 'INTEGER') return 'Type.Number()'
                if (col.type === 'TEXT') return 'Type.String()'
                if (col.type === 'string') return 'Type.String()'
                if (col.type === 'json') return `T.${jsTableName}_${col.name}_Schema`
                throw new Error(`unknown type '${col.type}' in ${jsTableName}.${col.name}`)
            })()

            schemaDecl += col.notnull //
                ? `    ${col.name}: Type.Optional(${schemaField}),\n`
                : `    ${col.name}: ${schemaField},\n`
            const colon = col.notnull ? ':' : '?:'
            typeDecl += `    ${comment}\n`
            typeDecl += `    ${col.name}${colon} ${fieldType};\n\n`
        }
        typeDecl += `}`
        schemaDecl += '},{ additionalProperties: false })'

        const insertFn = [
            `export const insert${jsTableName}SQL = '`,
            `insert into ${table.name} `,
            `(${cols.map((c) => c.name).join(', ')})`,
            ` values `,
            `(${cols.map((c) => `@${c.name}`).join(', ')})`,
            `'`,
        ].join('')

        // store.log(typeDecl)
        out1 += insertFn
        out1 += typeDecl + '\n'
        out1 += schemaDecl + '\n'
    }

    out1 += '\nexport const inserts = {\n'
    for (const table of tables) {
        out1 += `    ${table.name}: insert${convertTableNameToJSName(table.name)}SQL,\n`
    }
    out1 += '}'

    // console.log(out1)
    writeFileSync('src/db2/TYPES.gen.ts', out1)
    writeFileSync('src/db2/TYPES.d.ts', out2)
}

const convertTableNameToJSName = (tableName: string) => {
    let out = tableName.replace(/_(.)/g, (m, p1) => p1.toUpperCase())
    out = out[0].toUpperCase() + out.slice(1)
    return out
}
