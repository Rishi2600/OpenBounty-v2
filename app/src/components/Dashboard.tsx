import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'

// Demo data for display purposes
interface Bounty {
  id: string
  title: string
  amount: number
  deadline: number
  isClaimed: boolean
  organizer: string
}

export default function Dashboard() {
  const { publicKey } = useWallet()
  const { connection } = useConnection()

  const [bounties, setBounties] = useState<Bounty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'claimed' | 'expired'>('all')

  useEffect(() => {
    // In a real implementation, you'd fetch bounties from the blockchain
    // For demo purposes, we'll use mock data
    const mockBounties: Bounty[] = [
      {
        id: 'hackathon-2024-1',
        title: 'Best DeFi Project',
        amount: 2.5,
        deadline: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60,
        isClaimed: false,
        organizer: '7xKXsg...2Np8',
      },
      {
        id: 'hackathon-2024-2',
        title: 'Best NFT Innovation',
        amount: 1.0,
        deadline: Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60,
        isClaimed: true,
        organizer: '9mBkjh...5Lmn3',
      },
      {
        id: 'hackathon-2024-3',
        title: 'Community Choice Award',
        amount: 0.5,
        deadline: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        isClaimed: false,
        organizer: '3pQrty...8Klm2',
      },
      {
        id: 'web3-hack-001',
        title: 'Best Gaming DApp',
        amount: 3.0,
        deadline: Math.floor(Date.now() / 1000) + 1 * 24 * 60 * 60,
        isClaimed: false,
        organizer: '5sDfgj...9Jkl4',
      },
    ]

    setBounties(mockBounties)
    setIsLoading(false)
  }, [connection])

  const getBountyStatus = (bounty: Bounty) => {
    if (bounty.isClaimed) return 'claimed'
    if (bounty.deadline < Date.now() / 1000) return 'expired'
    return 'active'
  }

  const filteredBounties = bounties.filter(bounty => {
    if (activeFilter === 'all') return true
    const status = getBountyStatus(bounty)
    return status === activeFilter
  })

  const formatTimeRemaining = (deadline: number) => {
    const now = Math.floor(Date.now() / 1000)
    const diff = deadline - now

    if (diff <= 0) return 'Expired'

    const days = Math.floor(diff / (24 * 60 * 60))
    const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60))

    if (days > 0) return `${days}d ${hours}h remaining`
    return `${hours}h remaining`
  }

  const activeCount = bounties.filter(b => getBountyStatus(b) === 'active').length
  const totalValue = bounties.filter(b => !b.isClaimed).reduce((sum, b) => sum + b.amount, 0)

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          className="p-6 rounded-xl backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(44, 26, 15, 0.7)', border: '1px solid #3D2814' }}
        >
          <div className="text-sm mb-1" style={{ color: '#A89682' }}>Total Bounties</div>
          <div className="text-3xl font-bold" style={{ color: '#F5EFE6' }}>{bounties.length}</div>
        </div>
        <div
          className="p-6 rounded-xl backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(44, 26, 15, 0.7)', border: '1px solid #3D2814' }}
        >
          <div className="text-sm mb-1" style={{ color: '#A89682' }}>Active Bounties</div>
          <div className="text-3xl font-bold" style={{ color: '#14F195' }}>{activeCount}</div>
        </div>
        <div
          className="p-6 rounded-xl backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(44, 26, 15, 0.7)', border: '1px solid #3D2814' }}
        >
          <div className="text-sm mb-1" style={{ color: '#A89682' }}>Total Value Locked</div>
          <div className="text-3xl font-bold" style={{ color: '#C8860A' }}>{totalValue.toFixed(2)} SOL</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'active', 'claimed', 'expired'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: activeFilter === filter ? '#C8860A' : '#2C1A0F',
              color: activeFilter === filter ? '#1A100A' : '#A89682',
              border: activeFilter === filter ? 'none' : '1px solid #3D2814',
            }}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      {/* Bounty List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2" style={{ borderColor: '#3D2814', borderTopColor: '#C8860A' }}></div>
          <p className="mt-4" style={{ color: '#A89682' }}>Loading bounties...</p>
        </div>
      ) : filteredBounties.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={{ backgroundColor: 'rgba(44, 26, 15, 0.7)', border: '1px solid #3D2814' }}>
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: '#A89682' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p style={{ color: '#A89682' }}>No bounties found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBounties.map(bounty => {
            const status = getBountyStatus(bounty)
            return (
              <div
                key={bounty.id}
                className="p-6 rounded-xl backdrop-blur-sm hover:border-opacity-80 transition-colors"
                style={{
                  backgroundColor: 'rgba(44, 26, 15, 0.7)',
                  border: '1px solid rgba(61, 40, 20, 0.5)',
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold truncate" style={{ color: '#F5EFE6' }}>
                    {bounty.title}
                  </h3>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: status === 'active' ? 'rgba(20, 241, 149, 0.2)' :
                                     status === 'claimed' ? 'rgba(100, 116, 139, 0.2)' :
                                     'rgba(239, 68, 68, 0.2)',
                      color: status === 'active' ? '#14F195' :
                             status === 'claimed' ? '#64748B' :
                             '#EF4444',
                    }}
                  >
                    {status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#A89682' }}>Amount</span>
                    <span className="font-bold" style={{ color: '#14F195' }}>{bounty.amount} SOL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#A89682' }}>Time Left</span>
                    <span className="text-sm" style={{ color: status === 'expired' ? '#EF4444' : '#E8E0D5' }}>
                      {formatTimeRemaining(bounty.deadline)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: '#A89682' }}>Organizer</span>
                    <span className="text-sm font-mono" style={{ color: '#E8E0D5' }}>{bounty.organizer}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #3D2814' }}>
                  <div className="text-xs font-mono truncate mb-3" style={{ color: '#A89682' }}>
                    ID: {bounty.id}
                  </div>

                  {status === 'active' && publicKey && (
                    <button
                      className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: 'rgba(200, 134, 10, 0.2)',
                        color: '#C8860A',
                      }}
                    >
                      View Details
                    </button>
                  )}

                  {status === 'expired' && publicKey && (
                    <button
                      className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        color: '#EF4444',
                      }}
                    >
                      Request Refund
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
