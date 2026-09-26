"use client";

// Dev-only gallery of the design system: colors, type, buttons and our shared
// components on one page, for checking the theme at a glance. 404 in production.

import { notFound } from "next/navigation";
import { BN } from "@coral-xyz/anchor";
import { Inbox, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import Address from "@/components/common/Address";
import TokenAmount from "@/components/common/TokenAmount";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import StatCard from "@/components/common/StatCard";
import PageHeader from "@/components/layout/PageHeader";

const SWATCHES = [
  "bg-background", "bg-card", "bg-secondary", "bg-primary",
  "bg-accent", "bg-destructive", "bg-success", "bg-highlight",
];

const SAMPLE_ADDRESS = "4BagKzGnVv1b2hW6qS9m3YpTt8xQeRr5LdJ7uNcA35Hp";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

export default function ComponentsPreview() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Design system"
        description="Colors, type and shared components. Development only."
        actions={<Button variant="outline">Page action</Button>}
      />

      <Section title="Colors">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {SWATCHES.map((swatch) => (
            <div key={swatch} className="flex flex-col gap-1">
              <div className={`h-12 rounded-md border ${swatch}`} />
              <span className="font-mono text-xs text-muted-foreground">{swatch.replace("bg-", "")}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <p className="font-display text-3xl">DM Serif Display for titles</p>
        <p>DM Sans for body text, labels and buttons.</p>
        <p className="text-sm text-muted-foreground">Muted secondary text, still 8:1 contrast.</p>
        <TokenAmount amount={new BN(12_500_000_000)} asset="SOL" className="text-2xl" />
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button><Plus /> Create bounty</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Refund</Button>
          <Button disabled>Confirming...</Button>
          <Button variant="link">Link</Button>
        </div>
      </Section>

      <Section title="Badges and progress">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Open</Badge>
          <Badge variant="secondary">Ended</Badge>
          <Badge variant="outline">Voting · 2 of 3</Badge>
          <Badge variant="destructive">Refund available</Badge>
        </div>
        <Progress value={66} className="max-w-xs" aria-label="Votes" />
      </Section>

      <Section title="Form field">
        <div className="flex max-w-sm flex-col gap-2">
          <Label htmlFor="demo-title">Title</Label>
          <Input id="demo-title" placeholder="e.g. Build a wallet tracker" />
          <p className="text-sm text-muted-foreground">Up to 50 characters.</p>
        </div>
        <Button variant="outline" className="self-start" onClick={() => toast.success("Bounty created")}>
          Show a toast
        </Button>
      </Section>

      <Section title="Shared components">
        <Address address={SAMPLE_ADDRESS} isYou />
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Your bounties" value="2" />
          <StatCard label="Total locked" value={<TokenAmount amount={new BN(2_500_000_000)} asset="USDC" />} />
          <div className="flex flex-col gap-2 rounded-xl border p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
        <EmptyState
          icon={Inbox}
          title="No bounties yet"
          description="Bounties you create will show up here."
          action={<Button><Plus /> Create bounty</Button>}
        />
        <ErrorState onRetry={() => toast("Retrying...")} />
      </Section>
    </div>
  );
}
