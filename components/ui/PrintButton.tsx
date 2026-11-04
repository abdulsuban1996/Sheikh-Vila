"use client";

import { Printer } from "lucide-react";
import { Button } from "./Button";

export function PrintButton() {
  return (
    <Button variant="secondary" onClick={() => window.print()} className="no-print">
      <Printer size={20} /> প্রিন্ট / PDF
    </Button>
  );
}
