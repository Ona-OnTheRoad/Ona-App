export function ago(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}
