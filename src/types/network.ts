export interface ConnectionInfo {
  type: string
  candidates: { host: string; interface: string; priority: number }[]
  selectedHost: string
  port: number
  timestamp: number
}

// Compressed connection data format for QR codes
export interface CompressedConnectionInfo {
  0: 'CSA' // Magic identifier for Cherry Studio App
  1: number // Selected IP as number
  2: number[] // Candidate IPs as numbers
  3: number // Port number
  4: number // Timestamp for uniqueness
}