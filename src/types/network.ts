export interface ConnectionInfo {
  type: string
  candidates: { host: string; interface: string; priority: number }[]
  selectedHost: string
  port: number
  timestamp: number
}