import { MarketDetailResolver } from "~~/components/markets/MarketDetailResolver";
import { mockMarkets } from "~~/lib/mockMarkets";

type MarketPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MarketPage({ params }: MarketPageProps) {
  const { id } = await params;
  const market = mockMarkets.find(item => item.id === id);

  return <MarketDetailResolver id={id} initialMarket={market} />;
}
