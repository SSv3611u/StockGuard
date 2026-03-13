export function shouldBlockReorder(
  batches: Array<{
    expiryDate: Date | string;
    quantity: number;
    purchasePrice: number | null;
  }>,
): { block: boolean; daysLeft?: number; qty?: number; value?: number } {
  const today = new Date();
  const cutoff = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const atRisk = batches.filter((b) => {
    const exp = new Date(b.expiryDate);
    return exp > today && exp <= cutoff && b.quantity > 0;
  });

  if (atRisk.length === 0) return { block: false };

  const soonest = atRisk.reduce((min, b) =>
    new Date(b.expiryDate) < new Date(min.expiryDate) ? b : min,
  );
  const daysLeft = Math.ceil(
    (new Date(soonest.expiryDate).getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const qty = atRisk.reduce((s, b) => s + b.quantity, 0);
  const value = Math.round(
    atRisk.reduce((s, b) => s + b.quantity * (b.purchasePrice ?? 0), 0),
  );

  return { block: true, daysLeft, qty, value };
}
