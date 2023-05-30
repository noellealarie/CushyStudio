import type { Indexed, LiveDB } from './LiveDB'
import type { Maybe } from 'src/utils/types'
import type { LiveInstance } from './LiveInstance'
import type { TableName } from './LiveStore'

import * as mobx from 'mobx'
import { MERGE_PROTOTYPES } from './LiveHelpers'

export interface LiveEntityClass<T extends { id: string }, L> {
    new (...args: any[]): LiveInstance<T, L> & L
}

export class LiveTable<T extends { id: string }, L extends LiveInstance<T, L>> {
    Ktor: LiveEntityClass<T, L>

    store: Indexed<T>
    toJSON = (): Indexed<T> => this.store

    constructor(
        //
        public db: LiveDB,
        public name: TableName,
        public InstanceClass: LiveEntityClass<T, L>,
    ) {
        // ensure store has a key for this table
        if (!(name in db.store)) db.store[name] = {}
        this.store = (db.store as any)[name] as Indexed<T>

        // register
        this.db._tables.push(this)

        const BaseInstanceClass = class implements LiveInstance<T, T> {
            /** pointer to the liveDB */
            db!: LiveDB

            /** parent table */
            table!: LiveTable<T, any>

            /** instance data */
            data!: T

            /** this must be fired after creation and update */
            onCreate?: (data: T) => void

            onUpdate?: (prev: Maybe<T>, next: T) => void

            get id() { return this.data.id } // prettier-ignore

            update(t: Partial<T>) {
                const prev = this.onUpdate ? JSON.parse(JSON.stringify(this.data)) : undefined
                Object.assign(this.data, t)
                this.onUpdate?.(prev, this.data)
            }

            delete() {
                this.table.delete(this.data.id)
            }

            toJSON() {
                return this.data
            }

            init(table: LiveTable<T, L>, data: T) {
                this.db = table.db
                this.table = table
                this.data = data
                this.onCreate?.(data)
                this.onUpdate?.(undefined, data)
                mobx.makeAutoObservable(this)
            }
        }

        // make observable
        mobx.makeAutoObservable(this, { Ktor: false, store: false })

        MERGE_PROTOTYPES(InstanceClass, BaseInstanceClass)
        this.Ktor = InstanceClass
    }

    // UTILITIES -----------------------------------------------------------------------

    map = <R>(fn: (inst: L, ix: number) => R): R[] => {
        return this.values().map((v, ix) => fn(v, ix))
    }

    clear = () => {
        this.store
        this.instances.clear()
    }

    ids = (): T['id'][] => Object.keys(this.store)
    values = (): L[] => this.ids().map((id) => this.getOrThrow(id))
    mapData = <R>(fn: (k: T['id'], t: T) => R): R[] => Object.values(this.store).map((data) => fn(data.id, data))

    // UTILITIES -----------------------------------------------------------------------

    get = (id: string): Maybe<L> => {
        // 1. check if instance exists in the entity map
        const val = this.instances.get(id)
        if (val) return val

        // 2. check if data exists in the data store
        const store = this.db.store[this.name] ?? {}
        if (store[id]) return this._createInstance(store[id] as any)

        // 3. abort
        return null
    }

    getOrThrow = (id: string) => {
        const val = this.get(id)
        if (val == null) throw new Error(`ERR: ${this.name}(${id}) not found`)
        return val
    }

    getOrCreate = (id: string, def: () => T): L => {
        // 1. check if instance exists in the entity map
        const val = this.get(id)
        if (val == null) return this.create(def())
        return val
    }

    /** 🔴 unfinished */
    delete = (id: string) => {
        delete this.store[id]
        this.instances.delete(id)
    }

    /** only call with brand new data */
    create = (data: T): L => {
        const id = data.id

        // ensure no instance exists
        if (this.instances.has(id)) throw new Error(`ERR: ${this.name}(${id}) already exists`)

        // ensure no data with same id exists
        if (id in this.store) throw new Error(`ERR: ${this.name}(${id}) already exists in store`)

        this.store[id] = data

        const instance = this._createInstance(this.store[id])
        return instance
    }

    private instances = new Map<string, L>()

    /** only call this with some data already in the store */
    private _createInstance = (data: T): L => {
        const instance = new this.Ktor()
        instance.init(this, data)
        this.instances.set(data.id, instance)
        this.db.markDirty()
        return instance
    }

    upsert = (data: T): L => {
        const id = data.id
        // this.yjsMap.set(nanoid(), data)
        const prev = this.get(id)
        if (prev) {
            prev.update(data)
            return prev
        } else {
            const instance = this._createInstance(data)
            return instance
        }
    }
}
