/**
 * File-backed workshop store for local Vite dev / preview.
 * Production Cloudflare Pages uses KV via functions/ + workshopStoreCore.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  configureWorkshopStore,
  createSeedStore,
  hydrateStore,
  type StoreFile,
} from './workshopStoreCore.ts'

const DATA_DIR = resolve(process.cwd(), 'data')
const STORE_PATH = resolve(DATA_DIR, 'workshop.json')

let cached: StoreFile | null = null

function loadFromDisk(): StoreFile {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(STORE_PATH)) {
    const initial = createSeedStore()
    writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2))
    cached = initial
    return initial
  }
  try {
    const parsed = JSON.parse(readFileSync(STORE_PATH, 'utf8')) as Partial<StoreFile>
    const store = hydrateStore(parsed)
    if (!Array.isArray(parsed.machines) || !parsed.machines.length) {
      writeFileSync(STORE_PATH, JSON.stringify(store, null, 2))
    }
    cached = store
    return store
  } catch {
    const store = createSeedStore()
    cached = store
    return store
  }
}

function saveToDisk(store: StoreFile) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2))
  cached = store
}

configureWorkshopStore({
  load: () => cached ?? loadFromDisk(),
  save: (store) => saveToDisk(store),
  reset: () => {
    if (existsSync(STORE_PATH)) unlinkSync(STORE_PATH)
    cached = null
    const store = createSeedStore()
    saveToDisk(store)
  },
})

export * from './workshopStoreCore.ts'
