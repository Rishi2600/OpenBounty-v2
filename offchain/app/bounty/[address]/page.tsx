// Bounty detail page. The URL holds the escrow account address.

import BountyDetail from "@/components/bounty/BountyDetail";

interface Props {
  params: Promise<{ address: string }>;
}

export default async function BountyPage({ params }: Props) {
  const { address } = await params;
  return <BountyDetail address={address} />;
}
