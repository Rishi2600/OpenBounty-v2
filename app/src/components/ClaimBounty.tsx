import { useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction } from '@solana/web3.js'
import { findBountyAddress, sha256Hash } from '../utils/program'

export default function ClaimBounty() {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()

  const [bountyId, setBountyId] = useState('')
  const [organizerAddress, setOrganizerAddress] = useState('')
  const [secret, setSecret] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })

  const handleClaim = async () => {
    if (!publicKey) {
      setStatus({ type: 'error', message: 'Please connect your wallet' })
      return
    }

    if (!bountyId || !organizerAddress || !secret) {
      setStatus({ type: 'error', message: 'Please fill in all required fields' })
      return
    }

    setIsLoading(true)
    setStatus({ type: null, message: '' })

    try {
      const organizer = new PublicKey(organizerAddress)
      const bountyAddress = findBountyAddress(organizer, bountyId)

      // In a real implementation, you'd:
      // 1. Fetch the bounty account to verify it exists
      // 2. Check if it's already claimed
      // 3. Check if deadline has passed
      // 4. Submit the claim transaction

      // For demo purposes, we'll show the structure
      const secretHash = sha256Hash(secret)
      console.log('Claiming bounty:', {
        bountyAddress: bountyAddress.toString(),
        secretHash: Array.from(secretHash),
      })

      // Create a placeholder transaction
      const transaction = new Transaction()

      // Note: In production, you'd call the actual program instruction
      // This is a placeholder showing the intent
      const signature = await sendTransaction(transaction, connection)

      setStatus({
        type: 'success',
        message: `Bounty claimed! Transaction: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
      })

      // Clear form
      setBountyId('')
      setOrganizerAddress('')
      setSecret('')

    } catch (error: unknown) {
      console.error('Error claiming bounty:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim bounty'
      setStatus({ type: 'error', message: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="p-8 rounded-xl backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(44, 26, 15, 0.7)', border: '1px solid #3D2814' }}
      >
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: '#F5EFE6', fontFamily: 'DM Serif Display, Georgia, serif' }}
        >
          Claim Bounty
        </h2>
        <p className="mb-6" style={{ color: '#A89682' }}>
          Enter the details provided by the bounty organizer and your secret key to claim the reward.
        </p>

        <div className="space-y-6">
          {/* Organizer Address */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#E8E0D5' }}>
              Organizer Wallet Address <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={organizerAddress}
              onChange={(e) => setOrganizerAddress(e.target.value)}
              placeholder="Wallet address of the bounty creator"
              className="w-full px-4 py-3 rounded-lg text-white placeholder-opacity-50 focus:outline-none transition-colors font-mono text-sm"
              style={{
                backgroundColor: '#1A100A',
                border: '1px solid #3D2814',
                color: '#F5EFE6',
              }}
            />
          </div>

          {/* Bounty ID */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#E8E0D5' }}>
              Bounty ID <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={bountyId}
              onChange={(e) => setBountyId(e.target.value)}
              placeholder="e.g., hackathon-2024-prize-1"
              className="w-full px-4 py-3 rounded-lg text-white placeholder-opacity-50 focus:outline-none transition-colors"
              style={{
                backgroundColor: '#1A100A',
                border: '1px solid #3D2814',
                color: '#F5EFE6',
              }}
            />
          </div>

          {/* Secret */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#E8E0D5' }}>
              Secret Key <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter the secret key from the organizer"
              className="w-full px-4 py-3 rounded-lg text-white placeholder-opacity-50 focus:outline-none transition-colors font-mono"
              style={{
                backgroundColor: '#1A100A',
                border: '1px solid #3D2814',
                color: '#F5EFE6',
              }}
            />
            <p className="mt-2 text-sm" style={{ color: '#A89682' }}>
              Enter the exact secret key provided by the bounty organizer.
            </p>
          </div>

          {/* Status Message */}
          {status.type && (
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: status.type === 'success' ? 'rgba(20, 241, 149, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: status.type === 'success' ? '#14F195' : '#EF4444',
              }}
            >
              {status.message}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleClaim}
            disabled={isLoading || !publicKey}
            className="w-full py-4 text-white font-bold rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #14F195, #C8860A)',
              boxShadow: '0 0 20px rgba(20, 241, 149, 0.3)',
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Claiming Bounty...
              </span>
            ) : (
              'Claim Bounty'
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div
        className="mt-6 p-4 rounded-lg"
        style={{ backgroundColor: '#2C1A0F', border: '1px solid #3D2814' }}
      >
        <h3 className="font-semibold mb-2" style={{ color: '#F5EFE6' }}>How to Claim</h3>
        <ol className="text-sm space-y-2 list-decimal list-inside" style={{ color: '#A89682' }}>
          <li>Get the Bounty ID and Organizer address from the hackathon organizer</li>
          <li>Receive the secret key securely (via DM, email, or secure channel)</li>
          <li>Connect your wallet</li>
          <li>Enter the details above and submit your claim</li>
          <li>Funds will be transferred to your wallet upon successful verification</li>
        </ol>
      </div>
    </div>
  )
}
