import { useState } from 'react'
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import CreateBounty from './components/CreateBounty'
import ClaimBounty from './components/ClaimBounty'
import Dashboard from './components/Dashboard'
import { ProgramProvider } from './context/ProgramContext'
import '@solana/wallet-adapter-react-ui/styles.css'

function AppContent() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'claim'>('dashboard')
  const { connected } = useWallet()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A100A' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(44, 26, 15, 0.8)',
          borderBottom: '1px solid #3D2814'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #C8860A, #E8A020)' }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold" style={{ color: '#F5EFE6', fontFamily: 'DM Serif Display, Georgia, serif' }}>
              OpenBounty
            </h1>
          </div>

          {/* Wallet Button */}
          <WalletMultiButton
            className="!font-semibold !px-4 !py-2 !rounded-lg"
            style={{
              backgroundColor: '#C8860A',
              color: '#1A100A',
            }}
          />
        </div>
      </header>

      {/* Navigation */}
      <nav
        className="backdrop-blur-sm"
        style={{
          backgroundColor: 'rgba(44, 26, 15, 0.5)',
          borderBottom: '1px solid #3D2814'
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-6 py-3 font-medium transition-colors border-b-2"
              style={{
                color: activeTab === 'dashboard' ? '#E8A020' : '#A89682',
                borderColor: activeTab === 'dashboard' ? '#E8A020' : 'transparent',
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className="px-6 py-3 font-medium transition-colors border-b-2"
              style={{
                color: activeTab === 'create' ? '#E8A020' : '#A89682',
                borderColor: activeTab === 'create' ? '#E8A020' : 'transparent',
              }}
            >
              Create Bounty
            </button>
            <button
              onClick={() => setActiveTab('claim')}
              className="px-6 py-3 font-medium transition-colors border-b-2"
              style={{
                color: activeTab === 'claim' ? '#E8A020' : '#A89682',
                borderColor: activeTab === 'claim' ? '#E8A020' : 'transparent',
              }}
            >
              Claim Bounty
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {!connected ? (
          <div className="text-center py-20">
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#2C1A0F' }}
            >
              <svg className="w-12 h-12" style={{ color: '#A89682' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2
              className="text-3xl font-bold mb-2"
              style={{ color: '#F5EFE6', fontFamily: 'DM Serif Display, Georgia, serif' }}
            >
              Connect Your Wallet
            </h2>
            <p className="mb-6" style={{ color: '#A89682' }}>
              Connect your wallet to create or claim bounties
            </p>
            <WalletMultiButton
              className="!font-semibold !px-8 !py-3 !rounded-lg"
              style={{
                backgroundColor: '#C8860A',
                color: '#1A100A',
              }}
            />
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'create' && <CreateBounty />}
            {activeTab === 'claim' && <ClaimBounty />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        className="py-6 mt-12"
        style={{
          borderTop: '1px solid #3D2814',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center" style={{ color: '#A89682' }}>
          <p>OpenBounty - Decentralized Bounty Distribution on Solana</p>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  const network = WalletAdapterNetwork.Devnet
  const endpoint = clusterApiUrl(network)

  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ]

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ProgramProvider>
            <AppContent />
          </ProgramProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
