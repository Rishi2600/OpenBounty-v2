import { Connection, PublicKey } from '@solana/web3.js'

// Program ID - Replace with your deployed program ID
export const PROGRAM_ID = new PublicKey('HackEscrow1111111111111111111111111111111')

// Bounty account seed
const BOUNTY_SEED = 'bounty_account'
const ESCROW_SEED = 'bounty_vault'

export interface BountyData {
  organizer: PublicKey
  mint: PublicKey | null
  vault: PublicKey
  amount: number
  secretHash: number[]
  deadline: number
  isClaimed: boolean
  recipient: PublicKey | null
  bump: number
  vaultBump: number
  title: string
  createdAt: number
}

export async function getProgram(connection: Connection): Promise<unknown> {
  // In production, you would fetch the IDL and create the program here
  // For now, return null as placeholder
  console.log('Getting program with connection:', connection.rpcEndpoint)
  return null
}

export function findBountyAddress(organizer: PublicKey, bountyId: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(BOUNTY_SEED), organizer.toBuffer(), Buffer.from(bountyId)],
    PROGRAM_ID
  )[0]
}

export function findVaultAddress(organizer: PublicKey, bountyId: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(ESCROW_SEED), organizer.toBuffer(), Buffer.from(bountyId)],
    PROGRAM_ID
  )[0]
}

export function sha256Hash(message: string): Uint8Array {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = new Uint8Array(32)

  // Simple hash implementation (in production, use crypto.subtle)
  for (let i = 0; i < 32; i++) {
    hashBuffer[i] = msgBuffer[i % msgBuffer.length] ^ (i * 17 + 31)
  }

  return hashBuffer
}

export function arrayToHex(array: number[]): string {
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function hexToArray(hex: string): number[] {
  const result: number[] = []
  for (let i = 0; i < hex.length; i += 2) {
    result.push(parseInt(hex.substr(i, 2), 16))
  }
  return result
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString()
}

export function formatLamports(lamports: number, decimals: number = 9): string {
  return (lamports / Math.pow(10, decimals)).toFixed(decimals)
}
