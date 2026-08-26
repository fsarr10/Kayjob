export const FINAL_DELIVERY_ALLOWED = new Set([
  "escrowed", "in_progress", "preview_delivered", "final_delivered", "client_review", "completed_released"
]);

const transitions = {
  draft: new Set(["awaiting_payment", "cancelled"]),
  awaiting_payment: new Set(["escrowed", "cancelled"]),
  escrowed: new Set(["in_progress", "preview_delivered", "final_delivered"]),
  in_progress: new Set(["preview_delivered", "final_delivered"]),
  preview_delivered: new Set(["final_delivered"]),
  final_delivered: new Set(["client_review"]),
  client_review: new Set(["completed_released", "dispute_opened"]),
  dispute_opened: new Set(["dispute_resolved_client", "dispute_resolved_provider"]),
  dispute_resolved_provider: new Set(["completed_released"])
};

export function assertTransition(from, to) {
  if (from === to) return;
  if (!transitions[from]?.has(to)) {
    const error = new Error(`Invalid order transition: ${from} -> ${to}`);
    error.statusCode = 409;
    throw error;
  }
}

export function canDeliverFinal(status) {
  return FINAL_DELIVERY_ALLOWED.has(status);
}
