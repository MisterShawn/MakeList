import { Dexie, type EntityTable } from "dexie"

interface List {
    id: number
    name: string
    description?: string
    folder?: string
    boards?: string
    created_at: number
    updated_at: number
    is_deleted: boolean
}

interface Item {
    id: number
    name: string
    text?: string
    lists: string
    created_at: number
    updated_at: number
    is_deleted: boolean
}

interface Image {
    id: number
    name: string
    type: string
    created_at: number
    updated_at: number
    is_deleted: boolean
}

interface Tag {
    id: number
    name: string
    lists?: string
    items?: string
    images?: string
    boards?: string
    created_at: number
    updated_at: number
    is_deleted: boolean
}

interface Board {
    id: number
    name: string
    description?: string
    text?: string
    items?: string
    folder?: string
    lists?: string
    created_at: number
    updated_at: number
    is_deleted: boolean
}

const db = new Dexie("MakeList") as Dexie & {
    lists: EntityTable<
        List,
        "id"
    >,
    items: EntityTable<
        Item,
        "id"
    >,
    images: EntityTable<
        Image,
        "id"
    >,
    tags: EntityTable<
        Tag,
        "id"
    >,
    boards: EntityTable<
        Board,
        "id"
    >
}

db.version(1).stores({
    lists: "++id, name, description, text, *items, *tags, folder, *boards, created_at, updated_at, is_deleted",
    boards: "++id, name, description, text, *items, *tags, folder, *lists,  created_at, updated_at, is_deleted"
})

export type { List }
export { db }
