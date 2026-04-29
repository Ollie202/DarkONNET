import { notFound } from "next/navigation";
import { MarketDetail } from "~~/components/markets/MarketDetail";
import { mockMarkets } from "~~/lib/mockMarkets";

type MarketPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MarketPage({ params }: MarketPageProps) {
  const { id } = await params;
  const market = mockMarkets.find(item => item.id === id);

  if (!market) {
    notFound();
  }

  return <MarketDetail market={market} />;
}
