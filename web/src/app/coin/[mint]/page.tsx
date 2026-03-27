import { CoinDetail } from "./ui";

export default async function CoinPage({
  params,
}: {
  params: Promise<{ mint: string }>;
}) {
  const { mint } = await params;
  return <CoinDetail mintStr={mint} />;
}
