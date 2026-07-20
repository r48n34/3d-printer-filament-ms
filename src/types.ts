export const MATERIALS = ["PLA", "PETG", "TPU", "ABS", "ASA", "Other"] as const;

export type Material = (typeof MATERIALS)[number];

export interface Spool {
  id: string;
  name: string;
  initialWeightG: number;
  material?: Material;
  customMaterial?: string;
  color?: string;
  brand?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  purchaseCurrency?: string;
  notes?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrintRecord {
  id: string;
  spoolId: string;
  projectName: string;
  quantity: number;
  gramsPerItem: number;
  printedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AdjustmentKind = "add" | "remove" | "set";

export interface AdjustmentRecord {
  id: string;
  spoolId: string;
  kind: AdjustmentKind;
  amountG: number;
  reason: string;
  adjustedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type LedgerEntry =
  | { type: "print"; occurredAt: string; record: PrintRecord }
  | { type: "adjustment"; occurredAt: string; record: AdjustmentRecord };

export interface FilamentBackup {
  app: "spoolbook";
  version: 1;
  exportedAt: string;
  spools: Spool[];
  prints: PrintRecord[];
  adjustments: AdjustmentRecord[];
}
