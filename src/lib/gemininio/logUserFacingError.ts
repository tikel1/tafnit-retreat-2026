/**
 * Logs a Gemininio failure for debugging and returns a short reference
 * code to show in the UI (never the raw exception text).
 */
export function logGemError(scope: string, err: unknown): string {
  const code = String(100000 + Math.floor(Math.random() * 900000));
  const payload =
    err instanceof Error
      ? err
      : typeof err === "string"
        ? new Error(err)
        : err;
  console.error(`[Gemininio #${code}] ${scope}`, payload);
  return code;
}
