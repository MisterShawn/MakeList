// db.ts
import { Dexie, type EntityTable } from "dexie"

interface List {
    id: number
    title: string
    description: string
    header: string
    items: string
    tags: string
    folder: string
    created_at: number
    updated_at: number
}

const db = new Dexie("MakeList") as Dexie & {
    lists: EntityTable<
        List,
        "id" // primary key "id" (for the typings only)
    >
}

// Schema declaration:
db.version(1).stores({
    lists: "++id, title, description, header, *items, *tags, folder, created_at, updated_at", // primary key "id" (for the runtime!)
})

export type { List }
export { db }
