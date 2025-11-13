let SDK: typeof import('@somnia-chain/streams').SDK | null = null

const loadSDK = async () => {
	if (!SDK) {
		try {
			const sdkModule = await import('@somnia-chain/streams')
			SDK = sdkModule.SDK
		} catch (error) {
			console.error('Failed to load @somnia-chain/streams SDK:', error)
			throw error
		}
	}
	return SDK
}

import { createPublicClient, createWalletClient, http, webSocket } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { somniaTestnet } from './wagmi-config'

export interface TokenBalance {
	address: string
	symbol: string
	name: string
	balance: string
	value: string
	price: string
	change24h: number
	decimals: number
}

export interface Transaction {
	hash: string
	type: 'Received' | 'Sent' | 'Swap' | 'Stake' | 'Unstake'
	token: string
	amount: string
	timestamp: number
	status: 'pending' | 'confirmed' | 'failed'
	from?: string
	to?: string
}

export interface YieldPosition {
	protocol: string
	token: string
	deposited: string
	apy: string
	earned: string
	dailyRewards: string
	contractAddress: string
}

export interface PriceUpdate {
	token: string
	symbol: string
	price: string
	change24h: number
	timestamp: number
}

type StreamCallback<T> = (data: T) => void
type StreamUnsubscribe = () => void

class SomniaDataStreams {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private sdk: any = null
	private subscriptions: Map<string, { unsubscribe: () => void }> = new Map()
	private sdkSubscriptions: Map<string, { unsubscribe: () => void }> = new Map()
	private isInitialized = false

	constructor(private rpcUrl: string) {}

	async initialize(): Promise<void> {
		if (this.isInitialized && this.sdk) {
			return
		}

		if (typeof window !== 'undefined' && !window.Buffer) {
			console.warn('Buffer polyfill not loaded, SDK initialization may fail')
		}

		try {
			const SDKClass = await loadSDK()
			if (!SDKClass) {
				throw new Error('Failed to load SDK class')
			}

			let transport
			try {
				const wsUrl = this.rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://')
				transport = webSocket(wsUrl)
				console.log('Using WebSocket transport for subscriptions:', wsUrl)
			} catch (error) {
				console.warn('WebSocket transport not available, using HTTP:', error)
				transport = http(this.rpcUrl)
			}

			const publicClient = createPublicClient({
				chain: somniaTestnet,
				transport: transport,
			})

			const dummyAccount = privateKeyToAccount('0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`)
			const walletClient = createWalletClient({
				chain: somniaTestnet,
				account: dummyAccount,
				transport: http(this.rpcUrl),
			})

			this.sdk = new SDKClass({
				// @ts-expect-error - Type compatibility issue between viem and SDK types
				public: publicClient,
				wallet: walletClient,
			})

			this.isInitialized = true
			console.log('Somnia Data Streams SDK initialized')
		} catch (error) {
			console.error('Failed to initialize Somnia Data Streams SDK:', error)
			throw error
		}
	}

	private async ensureInitialized(): Promise<void> {
		if (!this.isInitialized || !this.sdk) {
			await this.initialize()
		}
	}

	subscribeToWalletBalances(
		walletAddress: string,
		callback: StreamCallback<TokenBalance[]>
	): StreamUnsubscribe {
		const streamId = `wallet:${walletAddress}:balances`
		
		const unsubscribe = () => {
			const sdkSubscription = this.sdkSubscriptions.get(streamId)
			if (sdkSubscription) {
				sdkSubscription.unsubscribe()
				this.sdkSubscriptions.delete(streamId)
			}
			this.subscriptions.delete(streamId)
		}

		this.ensureInitialized().then(() => {
			if (!this.sdk) {
				console.warn('SDK not initialized, using mock data')
				return
			}
		}).catch((error) => {
			console.error('Failed to subscribe to wallet balances:', error)
		})

		this.subscriptions.set(streamId, { unsubscribe })
		return unsubscribe
	}

	subscribeToTokenPrices(
		tokenAddresses: string[],
		callback: StreamCallback<PriceUpdate>
	): StreamUnsubscribe {
		const streamId = `prices:${tokenAddresses.join(',')}`
		
		const unsubscribe = () => {
			const sdkSubscription = this.sdkSubscriptions.get(streamId)
			if (sdkSubscription) {
				sdkSubscription.unsubscribe()
				this.sdkSubscriptions.delete(streamId)
			}
			this.subscriptions.delete(streamId)
		}

		this.ensureInitialized().then(() => {
			if (!this.sdk) {
				console.warn('SDK not initialized, using mock data')
				return
			}
		}).catch((error) => {
			console.error('Failed to subscribe to token prices:', error)
		})

		this.subscriptions.set(streamId, { unsubscribe })
		return unsubscribe
	}

	subscribeToTransactions(
		walletAddress: string,
		callback: StreamCallback<Transaction>
	): StreamUnsubscribe {
		const streamId = `wallet:${walletAddress}:transactions`
		
		const unsubscribe = () => {
			const sdkSubscription = this.sdkSubscriptions.get(streamId)
			if (sdkSubscription) {
				sdkSubscription.unsubscribe()
				this.sdkSubscriptions.delete(streamId)
			}
			this.subscriptions.delete(streamId)
		}

		this.ensureInitialized().then(() => {
			if (!this.sdk) {
				console.warn('SDK not initialized, using mock data')
				return
			}
		}).catch((error) => {
			console.error('Failed to subscribe to transactions:', error)
		})

		this.subscriptions.set(streamId, { unsubscribe })
		return unsubscribe
	}

	subscribeToYieldPositions(
		walletAddress: string,
		callback: StreamCallback<YieldPosition[]>
	): StreamUnsubscribe {
		const streamId = `wallet:${walletAddress}:yield`
		
		const unsubscribe = () => {
			const sdkSubscription = this.sdkSubscriptions.get(streamId)
			if (sdkSubscription) {
				sdkSubscription.unsubscribe()
				this.sdkSubscriptions.delete(streamId)
			}
			this.subscriptions.delete(streamId)
		}

		this.ensureInitialized().then(() => {
			if (!this.sdk) {
				console.warn('SDK not initialized, using mock data')
				return
			}
		}).catch((error) => {
			console.error('Failed to subscribe to yield positions:', error)
		})

		this.subscriptions.set(streamId, { unsubscribe })
		return unsubscribe
	}

	disconnect(): void {
		for (const [streamId, subscription] of this.sdkSubscriptions.entries()) {
			try {
				subscription.unsubscribe()
			} catch (error) {
				console.error(`Error unsubscribing from SDK subscription ${streamId}:`, error)
			}
		}
		this.sdkSubscriptions.clear()
		this.subscriptions.clear()
		this.sdk = null
		this.isInitialized = false
	}

	isConnected(): boolean {
		return this.isInitialized && this.sdk !== null
	}

	async connect(): Promise<void> {
		await this.initialize()
	}
}

const getRpcUrl = (): string => {
	const envRpcUrl = import.meta.env.VITE_SOMNIA_RPC_URL
	if (envRpcUrl) {
		return envRpcUrl
	}
	return 'https://dream-rpc.somnia.network'
}

export const somniaStreams = new SomniaDataStreams(getRpcUrl())
