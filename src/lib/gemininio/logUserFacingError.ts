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

type GemDict = (key: string, params?: Record<string, string>) => string;

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Maps common Gemini failures to short Hebrew copy for the UI. */
export function userFacingGemError(
  scope: string,
  err: unknown,
  t: GemDict
): string {
  const code = logGemError(scope, err);
  const msg = errorMessage(err);

  if (/429|quota|RESOURCE_EXHAUSTED|exceeded your current quota/i.test(msg)) {
    return t("gem_error_quota");
  }
  if (/401|403|API key|invalid.*key|PERMISSION_DENIED|permission/i.test(msg)) {
    return t("gem_error_key");
  }
  if (/Failed to fetch|NetworkError|network|fetch/i.test(msg)) {
    return t("gem_error_network");
  }

  return t("gem_error_occurred", { code });
}
