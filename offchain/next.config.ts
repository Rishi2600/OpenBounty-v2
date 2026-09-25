import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The old "Claim Bounty" link pointed at /claim; claims now live on "Your bounties"
  async redirects() {
    return [{ source: "/claim", destination: "/me", permanent: false }];
  },
};

export default nextConfig;
