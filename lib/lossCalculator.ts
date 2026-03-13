type BatchForRisk = {
  expiryDate: Date | string;
  quantity: number;
  purchasePrice: number | null;
};

type ReturnLogForRecovery = {
  outcome: string;
  sentAt: Date | string;
  batch: { quantity: number; purchasePrice: number | null };
};

type BatchForLost = {
  id: string;
  expiryDate: Date | string;
  quantity: number;
  purchasePrice: number | null;
};

export function calcAtRisk(batches: BatchForRisk[]): number {
  const today = new Date();
  const cutoff = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  return batches
    .filter((b) => {
      const exp = new Date(b.expiryDate);
      return exp > today && exp <= cutoff && b.purchasePrice;
    })
    .reduce((s, b) => s + b.quantity * (b.purchasePrice ?? 0), 0);
}

export function calcRecovered(returnLogs: ReturnLogForRecovery[]): number {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return returnLogs
    .filter((r) => {
      const sent = new Date(r.sentAt);
      return r.outcome === "accepted" && sent >= start && r.batch.purchasePrice;
    })
    .reduce((s, r) => s + r.batch.quantity * (r.batch.purchasePrice ?? 0), 0);
}

export function calcLost(
  batches: BatchForLost[],
  acceptedBatchIds: Set<string>,
): number {
  const today = new Date();
  return batches
    .filter((b) => {
      const exp = new Date(b.expiryDate);
      return exp < today && !acceptedBatchIds.has(b.id) && b.purchasePrice;
    })
    .reduce((s, b) => s + b.quantity * (b.purchasePrice ?? 0), 0);
}
