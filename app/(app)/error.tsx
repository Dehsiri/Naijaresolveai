"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex-1 px-4 md:px-6 py-12 max-w-[540px] w-full mx-auto flex items-center justify-center">
      <Card className="w-full text-center p-6 space-y-4">
        <div className="h-11 w-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="text-[19px] font-extrabold text-navy">
          Something went wrong
        </h2>
        <p className="text-[14px] text-muted">
          {error.message ||
            "We encountered an unexpected error while loading this screen."}
        </p>
        <div className="pt-2">
          <Button onClick={() => reset()}>Try again</Button>
        </div>
      </Card>
    </main>
  );
}
