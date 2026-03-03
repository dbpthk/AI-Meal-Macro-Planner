"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logWeightAndAdjust } from "@/app/actions/log-weight";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type WeightLogFormProps = {
  initialWeight?: number | null;
  initialDate?: string;
};

export function WeightLogForm({
  initialWeight,
  initialDate,
}: WeightLogFormProps) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [weight, setWeight] = useState(initialWeight?.toString() ?? "");
  const [date, setDate] = useState(initialDate ?? today);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const weightNum = Number(weight);
    if (!weightNum || weightNum < 20 || weightNum > 300) {
      setError("Enter weight between 20–300 kg.");
      return;
    }
    setPending(true);
    try {
      const result = await logWeightAndAdjust(weightNum, date);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="weight-log-kg" className="text-xs">
          Weight (kg)
        </Label>
        <Input
          id="weight-log-kg"
          type="number"
          min={20}
          max={300}
          step={0.1}
          placeholder="70"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          disabled={pending}
          className="w-24"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="weight-log-date" className="text-xs">
          Date
        </Label>
        <Input
          id="weight-log-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={pending}
          className="w-36"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving..." : "Log weight"}
      </Button>
      {error && (
        <p className="w-full text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="w-full text-sm text-primary" role="status">
          Weight saved. Macro targets updated.
        </p>
      )}
    </form>
  );
}
