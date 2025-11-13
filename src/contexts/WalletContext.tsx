import { useAccount, useDisconnect } from 'wagmi'

export function useWallet() {
	const { address, isConnected, chainId } = useAccount()
	const { disconnect } = useDisconnect()

	return {
		address: address || null,
		isConnected,
		chainId,
		disconnect,
	}
}

