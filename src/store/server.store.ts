import { create } from 'zustand'

interface ServerState {
  serverReady: boolean
  setServerReady: () => void
}

export const useServerStore = create<ServerState>()((set) => ({
  serverReady: false,
  setServerReady: () => set({ serverReady: true }),
}))
