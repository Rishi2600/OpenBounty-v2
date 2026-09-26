"use client";

// The create-bounty form: basics, judges, prizes and deadline, then one transaction.
// Errors appear after the first submit attempt and update as you type.

import { FormEvent, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Loader2, Lock, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import FormField, { messageId } from "@/components/common/FormField";
import JudgesField from "./JudgesField";
import PrizeTiersField from "./PrizeTiersField";
import AssetPicker from "./AssetPicker";
import { AssetId, MULTI_ASSET_PREVIEW } from "@/constants/assets";
import CreateSuccess from "./CreateSuccess";
import {
  CreateBountyValues,
  CreatedBounty,
  hasErrors,
  useCreateBounty,
  validateForm,
} from "@/hooks/useCreateBounty";
import { friendlyTxError } from "@/utils/txErrors";

export default function CreateBountyForm() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { createBounty, submitting } = useCreateBounty();

  const [asset, setAsset] = useState<AssetId>("SOL");
  const [title, setTitle] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [judges, setJudges] = useState<string[]>([""]);
  const [threshold, setThreshold] = useState(1);
  const [amounts, setAmounts] = useState<string[]>([""]);
  const [deadline, setDeadline] = useState("");
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [created, setCreated] = useState<CreatedBounty | null>(null);

  // Blank rows are ignored, so a spare empty input never blocks submitting
  const values: CreateBountyValues = {
    asset,
    title,
    metadataUri,
    judges: judges.filter((judge) => judge.trim() !== ""),
    threshold,
    tierAmounts: amounts.filter((amount) => amount.trim() !== ""),
    deadline,
  };
  const errors = triedSubmit ? validateForm(values) : {};

  function resetForm() {
    setTitle("");
    setMetadataUri("");
    setJudges([""]);
    setThreshold(1);
    setAmounts([""]);
    setAsset("SOL");
    setDeadline("");
    setTriedSubmit(false);
    setCreated(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!publicKey) {
      setVisible(true);
      return;
    }

    setTriedSubmit(true);
    if (hasErrors(validateForm(values))) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    try {
      const result = await createBounty(values);
      toast.success("Bounty created");
      setCreated(result);
    } catch (err) {
      toast.error(friendlyTxError(err));
    }
  }

  if (created) {
    return (
      <CreateSuccess
        signature={created.signature}
        address={created.address}
        onCreateAnother={resetForm}
      />
    );
  }

  let submitContent = <><Lock /> Lock prizes and create</>;
  if (!publicKey) submitContent = <><Wallet /> Connect wallet to create</>;
  if (submitting) submitContent = <><Loader2 className="animate-spin" /> Confirming...</>;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card className="gap-8 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6">
          <FormField id="title" label="Title" helper="Up to 50 characters." error={errors.title}>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build a Solana wallet tracker"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={messageId("title")}
            />
          </FormField>

          <FormField
            id="metadata-uri"
            label="Details link (optional)"
            helper="Link to the full brief, e.g. on IPFS or Arweave. Up to 100 characters."
            error={errors.metadataUri}
          >
            <Input
              id="metadata-uri"
              value={metadataUri}
              onChange={(e) => setMetadataUri(e.target.value)}
              placeholder="ipfs://... or https://..."
              aria-invalid={Boolean(errors.metadataUri)}
              aria-describedby={messageId("metadata-uri")}
            />
          </FormField>
        </div>

        <Separator />

        <JudgesField
          judges={judges}
          threshold={threshold}
          judgesError={errors.judges}
          thresholdError={errors.threshold}
          onJudgesChange={setJudges}
          onThresholdChange={setThreshold}
        />

        <Separator />

        {MULTI_ASSET_PREVIEW && <AssetPicker value={asset} onChange={setAsset} />}

        <PrizeTiersField asset={asset} amounts={amounts} error={errors.tierAmounts} onChange={setAmounts} />

        <Separator />

        <FormField
          id="deadline"
          label="Deadline"
          helper="Judges can vote until then. After it, you can refund prizes nobody claimed."
          error={errors.deadline}
        >
          <Input
            id="deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            aria-invalid={Boolean(errors.deadline)}
            aria-describedby={messageId("deadline")}
            className="w-full sm:w-72"
          />
        </FormField>

        <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto sm:self-end">
          {submitContent}
        </Button>
      </Card>
    </form>
  );
}
