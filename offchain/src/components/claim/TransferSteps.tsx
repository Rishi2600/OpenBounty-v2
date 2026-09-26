// Step-by-step progress for a claim that swaps and/or moves to another chain.
// In the preview these steps are simulated.

import { Circle, CircleCheck, Loader2 } from "lucide-react";

interface Props {
  steps: string[];
  done: number;          // how many steps have finished
  running: boolean;      // true while the next step is in progress
}

export default function TransferSteps({ steps, done, running }: Props) {
  return (
    <ol className="flex flex-col gap-3" aria-live="polite">
      {steps.map((label, index) => {
        const finished = index < done;
        const active = index === done && running;
        return (
          <li key={label} className="flex items-center gap-3 text-sm">
            {finished && <CircleCheck className="size-5 shrink-0 text-success" aria-hidden />}
            {active && <Loader2 className="size-5 shrink-0 animate-spin text-primary" aria-hidden />}
            {!finished && !active && <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden />}
            <span className={finished ? "text-foreground" : "text-muted-foreground"}>{label}</span>
          </li>
        );
      })}
      <li className="text-xs text-muted-foreground">Preview: these steps are simulated.</li>
    </ol>
  );
}
