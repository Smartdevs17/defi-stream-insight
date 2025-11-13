import { useEffect, useState, useCallback, useRef } from 'react'
import { somniaStreams, TokenBalance, Transaction, YieldPosition, PriceUpdate } from '@/lib/somnia-sdk'
import { 
	getMockTokenBalances, 
	getMockTransactions, 
	getMockYieldPositions, 
	getMockPriceUpdates 
} from '@/lib/mock-data'
import { getTokenBalances } from '@/lib/fetch-real-balances'

export function useSomniaConnection() {
	const [isConnected, setIsConnected] = useState(false)
	const [isConnecting, setIsConnecting] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		setIsConnecting(true)
		
		const initTimeout = setTimeout(() => {
			somniaStreams.initialize()
				.then(() => {
					setIsConnected(true)
					setIsConnecting(false)
					setError(null)
				})
				.catch((err) => {
					setError(err)
					setIsConnecting(false)
					setIsConnected(false)
					console.warn('Somnia Data Streams initialization failed, using mock data:', err)
				})
		}, 100)

		return () => {
			clearTimeout(initTimeout)
			somniaStreams.disconnect()
			setIsConnected(false)
		}
	}, [])

	useEffect(() => {
		const checkConnection = setInterval(() => {
			const connected = somniaStreams.isConnected()
			setIsConnected(connected)
		}, 1000)

		return () => clearInterval(checkConnection)
	}, [])

	return { isConnected, isConnecting, error }
}

export function useWalletBalances(walletAddress: string | null) {
	const [balances, setBalances] = useState<TokenBalance[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [useMockData, setUseMockData] = useState(false)
	const callbackRef = useRef<((data: TokenBalance[]) => void) | null>(null)

	useEffect(() => {
		if (!walletAddress) {
			setBalances([])
			setIsLoading(false)
			setUseMockData(false)
			return
		}

		const mockData = getMockTokenBalances(walletAddress)
		setBalances(mockData)
		setIsLoading(false)
		setUseMockData(true)

		getTokenBalances(walletAddress)
			.then((realBalances) => {
				if (realBalances && realBalances.length > 0) {
					const hasRealData = realBalances.some(
						(b) => parseFloat(b.balance) > 0.001
					)
					if (hasRealData) {
						setBalances(realBalances)
						setUseMockData(false)
					}
				}
			})
			.catch((error) => {
				console.warn('Failed to fetch real balances:', error)
			})

		callbackRef.current = (data: TokenBalance[]) => {
			if (data && data.length > 0) {
				setBalances(data)
				setUseMockData(false)
			}
		}

		const unsubscribe = somniaStreams.subscribeToWalletBalances(
			walletAddress,
			callbackRef.current
		)

		return () => {
			unsubscribe()
		}
	}, [walletAddress])

	return { balances, isLoading, useMockData }
}

export function useTokenPrices(tokenAddresses: string[]) {
	const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map())
	const [useMockData, setUseMockData] = useState(false)
	const callbackRef = useRef<((data: PriceUpdate) => void) | null>(null)

	useEffect(() => {
		if (tokenAddresses.length === 0) {
			return
		}

		const mockPrices = getMockPriceUpdates(tokenAddresses)
		if (mockPrices.size > 0) {
			setPrices(mockPrices)
			setUseMockData(true)
		}

		callbackRef.current = (data: PriceUpdate) => {
			setPrices((prev) => {
				const next = new Map(prev)
				next.set(data.token, data)
				return next
			})
			setUseMockData(false)
		}

		const unsubscribe = somniaStreams.subscribeToTokenPrices(
			tokenAddresses,
			callbackRef.current
		)

		return () => {
			unsubscribe()
		}
	}, [tokenAddresses.join(',')])

	return { prices, useMockData }
}

export function useWalletTransactions(walletAddress: string | null, limit: number = 10) {
	const [transactions, setTransactions] = useState<Transaction[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [useMockData, setUseMockData] = useState(false)
	const callbackRef = useRef<((data: Transaction) => void) | null>(null)

	useEffect(() => {
		if (!walletAddress) {
			setTransactions([])
			setIsLoading(false)
			setUseMockData(false)
			return
		}

		const mockData = getMockTransactions(walletAddress).slice(0, limit)
		setTransactions(mockData)
		setIsLoading(false)
		setUseMockData(true)

		callbackRef.current = (data: Transaction) => {
			setTransactions((prev) => {
				const updated = [data, ...prev]
				return updated.slice(0, limit)
			})
			setUseMockData(false)
		}

		const unsubscribe = somniaStreams.subscribeToTransactions(
			walletAddress,
			callbackRef.current
		)

		return () => {
			unsubscribe()
		}
	}, [walletAddress, limit])

	return { transactions, isLoading, useMockData }
}

export function useYieldPositions(walletAddress: string | null) {
	const [positions, setPositions] = useState<YieldPosition[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [useMockData, setUseMockData] = useState(false)
	const callbackRef = useRef<((data: YieldPosition[]) => void) | null>(null)

	useEffect(() => {
		if (!walletAddress) {
			setPositions([])
			setIsLoading(false)
			setUseMockData(false)
			return
		}

		const mockData = getMockYieldPositions(walletAddress)
		setPositions(mockData)
		setIsLoading(false)
		setUseMockData(true)

		callbackRef.current = (data: YieldPosition[]) => {
			if (data && data.length > 0) {
				setPositions(data)
				setUseMockData(false)
			}
		}

		const unsubscribe = somniaStreams.subscribeToYieldPositions(
			walletAddress,
			callbackRef.current
		)

		return () => {
			unsubscribe()
		}
	}, [walletAddress])

	return { positions, isLoading, useMockData }
}

export function usePortfolioValue(balances: TokenBalance[]) {
	const [totalValue, setTotalValue] = useState(0)
	const [change24h, setChange24h] = useState(0)

	useEffect(() => {
		const total = balances.reduce((sum, balance) => {
			const value = parseFloat(balance.value.replace(/[^0-9.-]/g, '')) || 0
			return sum + value
		}, 0)

		const weightedChange = balances.reduce((sum, balance) => {
			const value = parseFloat(balance.value.replace(/[^0-9.-]/g, '')) || 0
			const weight = value / total
			return sum + (balance.change24h * weight)
		}, 0)

		setTotalValue(total)
		setChange24h(weightedChange)
	}, [balances])

	return { totalValue, change24h }
}

