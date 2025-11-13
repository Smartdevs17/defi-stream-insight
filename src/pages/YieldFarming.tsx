import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ExternalLink, Plus, Loader2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useYieldPositions } from "@/hooks/use-somnia-streams";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const YieldFarming = () => {
	const { address, isConnected } = useWallet();
	const navigate = useNavigate();

	// Redirect to connect wallet if not connected
	useEffect(() => {
		if (!isConnected || !address) {
			navigate("/connect-wallet", { replace: true });
		}
	}, [isConnected, address, navigate]);
	const { positions, isLoading } = useYieldPositions(address);

	// Calculate summary statistics from real-time data
	const totalDeposited = positions.reduce((sum, pos) => {
		const value = parseFloat(pos.deposited.replace(/[^0-9.-]/g, '')) || 0;
		return sum + value;
	}, 0);

	const totalEarned = positions.reduce((sum, pos) => {
		const value = parseFloat(pos.earned.replace(/[^0-9.-]/g, '')) || 0;
		return sum + value;
	}, 0);

	const averageAPY = positions.length > 0
		? positions.reduce((sum, pos) => {
			const apy = parseFloat(pos.apy.replace('%', '')) || 0;
			return sum + apy;
		}, 0) / positions.length
		: 0;

	// Available pools (this could also come from a stream in the future)
	const availablePools = [
		{
			protocol: "Curve Finance",
			pair: "USDC-USDT",
			apy: "8.2%",
			tvl: "$125M",
			risk: "Low",
			logo: "📈",
		},
		{
			protocol: "Uniswap V3",
			pair: "ETH-USDC",
			apy: "12.5%",
			tvl: "$89M",
			risk: "Medium",
			logo: "🦄",
		},
		{
			protocol: "Balancer",
			pair: "BAL-WETH",
			apy: "15.8%",
			tvl: "$42M",
			risk: "Medium",
			logo: "⚖️",
		},
		{
			protocol: "Yearn Finance",
			pair: "USDT Vault",
			apy: "6.7%",
			tvl: "$156M",
			risk: "Low",
			logo: "🔷",
		},
	];

  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-8 h-8 text-accent" />
            <h1 className="text-4xl font-bold">Yield Farming</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Manage your staking positions and discover new yield opportunities
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time updates powered by Somnia Data Streams
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Deposited</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-3xl font-bold">
                  ${totalDeposited.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Earned</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-3xl font-bold text-success">
                  ${totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Average APY</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-3xl font-bold text-accent">
                  {averageAPY.toFixed(2)}%
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Positions */}
        <Card className="glass border-border mb-8">
          <CardHeader>
            <CardTitle>Active Positions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : positions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isConnected ? "No active yield positions" : "Connect your wallet to view yield positions"}
              </div>
            ) : (
              <div className="space-y-4">
                {positions.map((farm, index) => (
                  <div
                    key={`${farm.protocol}-${farm.contractAddress}-${index}`}
                    className="p-6 glass rounded-lg border border-border hover:border-accent/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-2xl">
                          {farm.token.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{farm.protocol}</div>
                          <div className="text-sm text-muted-foreground">{farm.token}</div>
                        </div>
                      </div>
                      <Badge className="bg-accent/20 text-accent border-accent/30 text-base px-3 py-1">
                        {farm.apy} APY
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Deposited</div>
                        <div className="font-semibold">{farm.deposited}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Total Earned</div>
                        <div className="font-semibold text-success">{farm.earned}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Daily Rewards</div>
                        <div className="font-semibold">{farm.dailyRewards}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Claimable</div>
                        <div className="font-semibold text-accent">{farm.earned}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        Claim Rewards
                      </Button>
                      <Button variant="outline" className="glass border-border">
                        Add More
                      </Button>
                      <Button variant="outline" className="glass border-border">
                        Unstake
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Pools */}
        <Card className="glass border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Available Yield Pools</CardTitle>
              <Button variant="outline" className="glass border-border gap-2">
                <Plus className="w-4 h-4" />
                Explore More
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {availablePools.map((pool, index) => (
                <div
                  key={index}
                  className="p-5 glass rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-xl">
                        {pool.logo}
                      </div>
                      <div>
                        <div className="font-semibold">{pool.protocol}</div>
                        <div className="text-sm text-muted-foreground">{pool.pair}</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">APY</div>
                      <div className="font-bold text-accent">{pool.apy}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">TVL</div>
                      <div className="font-semibold">{pool.tvl}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Risk</div>
                      <Badge
                        variant="outline"
                        className={
                          pool.risk === "Low"
                            ? "border-success/50 text-success"
                            : "border-accent/50 text-accent"
                        }
                      >
                        {pool.risk}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-accent hover:opacity-90">
                    Stake Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default YieldFarming;
