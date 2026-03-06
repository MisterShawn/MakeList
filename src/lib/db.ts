// db.ts
import { Dexie, type EntityTable } from "dexie"

interface List {
    id: number
    title: string
    description?: string
    header?: string
    items?: string
    tags?: string
    folder?: string
    boards?: string
    created_at: number
    updated_at: number
}

interface Board {
    id: number
    title: string
    description?: string
    header?: string
    items?: string
    tags?: string
    folder?: string
    lists?: string
    created_at: number
    updated_at: number
}

const db = new Dexie("MakeList") as Dexie & {
    lists: EntityTable<
        List,
        "id"
    >,
    boards: EntityTable<
        Board,
        "id"
    >
}

db.version(1).stores({
    lists: "++id, title, description, header, *items, *tags, folder, *boards, created_at, updated_at",
    boards: "++id, title, description, header, *items, *tags, folder, *lists,  created_at, updated_at"
})

export type { List }
export { db }
