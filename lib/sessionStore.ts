// In-memory session store for WhatsApp conversation state
// Keyed by phone number (e.g. "+919876543210")

export type SessionState =
  | { step: "idle" }
  | { step: "awaiting_return_confirm"; batchId: string; distributorId: string; productName: string; batchNumber: string | null; expiryDate: string; quantity: number; purchasePrice: number | null; distributorName: string; shopName: string }
  | { step: "awaiting_return_outcome"; batchId: string; distributorId: string }
  | { step: "awaiting_broadcast_mrp"; batchId: string; productName: string; shopName: string };

const store = new Map<string, SessionState>();

export function getSession(phone: string): SessionState {
  return store.get(phone) ?? { step: "idle" };
}

export function setSession(phone: string, state: SessionState): void {
  store.set(phone, state);
}

export function clearSession(phone: string): void {
  store.set(phone, { step: "idle" });
}
