import { MarketDetailResolver } from "~~/components/markets/MarketDetailResolver";

type MarketPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MarketPage({ params }: MarketPageProps) {
  const { id } = await params;

  return <MarketDetailResolver id={id} />;
}
