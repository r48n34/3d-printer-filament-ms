import { createId, db } from "../db";
import type { PrintRecord } from "../types";

export interface PrintRecordInput {
  spoolId: string;
  projectName: string;
  quantity: number;
  gramsPerItem: number;
  printedAt: string;
  notes?: string;
}

export const savePrintRecord = async (
  input: PrintRecordInput,
  existing?: PrintRecord,
): Promise<PrintRecord> => {
  const now = new Date().toISOString();
  const record: PrintRecord = {
    id: existing?.id ?? createId(),
    spoolId: input.spoolId,
    projectName: input.projectName.trim(),
    quantity: input.quantity,
    gramsPerItem: input.gramsPerItem,
    printedAt: input.printedAt,
    notes: input.notes?.trim() || undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await db.prints.put(record);
  return record;
};
