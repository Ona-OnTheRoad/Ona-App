/** Token text colour for a shop order / delivery status string. */
export function orderStatusTone(status: string): string {
  if (status.includes("paid") || status.includes("delivered"))
    return "text-ona-success";
  if (status.includes("refund") || status.includes("cancelled"))
    return "text-ona-danger";
  return "text-ona-brand-ink";
}
