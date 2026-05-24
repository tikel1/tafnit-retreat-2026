import { createContext, useContext, type ReactNode } from "react";
import type { Lang } from "./lang";

/**
 * Hebrew-only language context. Kept as a context so ported components
 * don't need to be rewritten to drop the `useLang()` hook — the value
 * is just always `{ lang: "he" }`.
 */

interface LangCtx {
  lang: Lang;
}

const Ctx = createContext<LangCtx>({ lang: "he" });

export function LangProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={{ lang: "he" }}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  return useContext(Ctx);
}
