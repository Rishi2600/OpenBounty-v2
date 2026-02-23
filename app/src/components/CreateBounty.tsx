import { useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { SystemProgram, Transaction } from '@solana/web3.js'
import { findVaultAddress } from '../utils/program'

export default function CreateBounty() {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()

  const [bountyId, setBountyId] = useState('')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [secret, setSecret] = useState('')
  const [duration, setDuration] = useState('7')
  const [recipient, setRecipient] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })

  const handleCreate = async () => {
    if (!publicKey) {
      setStatus({ type: 'error', message: 'Please connect your wallet' })
      return
    }

    if (!bountyId || !title || !amount || !secret) {
      setStatus({ type: 'error', message: 'Please fill in all required fields' })
      return
    }

    setIsLoading(true)
    setStatus({ type: null, message: '' })

    try {
      const vaultAddress = findVaultAddress(publicKey, bountyId)
      const amountLamports = Math.floor(parseFloat(amount) * 1e9)

      const transaction = new Transaction()

      // Add instruction to create bounty and transfer funds
      // Note: In a real implementation, you'd use the program IDL
      // This is a placeholder that shows the structure
      const instruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: vaultAddress,
        lamports: amountLamports,
      })

      transaction.add(instruction)

      const signature = await sendTransaction(transaction, connection)

      setStatus({
        type: 'success',
        message: `Bounty created! Transaction: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
      })

      // Clear form
      setBountyId('')
      setTitle('')
      setAmount('')
      setSecret('')
      setDuration('7')
      setRecipient('')

      // Show the secret to share (in real app, this would be handled differently)
      alert(`Bounty created! Secret: "${secret}" - Share this with the winner!`)

    } catch (error: unknown) {
      console.error('Error creating bounty:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create bounty'
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
          className="text-2xl font-bold mb-6"
          style={{ color: '#F5EFE6', fontFamily: 'DM Serif Display, Georgia, serif' }}
        >
          Create New Bounty
        </h2>

        <div className="space-y-6">
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
              className="w-full px-4 py-3 rounded-lg text-white placeholder-opacity-50 focus:outline-none transition-colors font-mono text-sm"
              style={{
                backgroundColor: '#1A100A',
                border: '1px solid #3D2814',
                color: '#F5EFE6',
              }}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#E8E0D5' }}>
              Title <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Best DeFi Hack"
              className="w-full px-4 py-3 rounded-lg text-white placeholder-opacity-50 focus:outline-none transition-colors"
              style={{
                backgroundColor: '#1A100A',
                border: '1px solid #3D2814',
                color: '#F5EFE6',
              }}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#E8E0D5' }}>
              Amount (SOL) <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 1.5"
              step="0.1"
              min="0"
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
              placeholder="Secret only the winner will know"
              className="w-full px-4 py-3 rounded-lg text-white placeholder-opacity-50 focus:outline-none transition-colors font-mono"
              style={{
                backgroundColor: '#1A100A',
                border: '1px solid #3D2814',
                color: '#F5EFE6',
              }}
            />
            <p className="mt-2 text-sm" style={{ color: '#A89682' }}>
              This secret will be hashed and stored on-chain. Only someone with the exact secret can claim the bounty.
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#E8E0D5' }}>
              Duration (Days)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-white focus:outline-none transition-colors"
              style={{
                backgroundColor: '#1A100A',
                border: '1px solid #3D2814',
                color: '#F5EFE6',
              }}
            >
              <option value="1">1 Day</option>
              <option value="3">3 Days</option>
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
            </select>
          </div>

          {/* Optional Recipient */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#E8E0D5' }}>
              Specific Recipient (Optional)
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Wallet address (leave empty for anyone)"
              className="w-full px-4 py-3 rounded-lg text-white placeholder-opacity-50 focus:outline-none transition-colors font-mono text-sm"
              style={{
                backgroundColor: '#1A100A',
                border: '1px solid #3D2814',
                color: '#F5EFE6',
              }}
            />
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
            onClick={handleCreate}
            disabled={isLoading || !publicKey}
            className="w-full py-4 text-white font-bold rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #C8860A, #E8A020)',
              boxShadow: '0 0 20px rgba(200, 134, 10, 0.3)',
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Bounty...
              </span>
            ) : (
              'Lock Bounty Funds'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
