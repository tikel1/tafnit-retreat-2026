import type { ReactNode } from "react";

/** Israeli mobile/landline patterns like 054-860-88-88 or 03-520-2525. */
const PHONE_RE = /0\d{1,2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g;

function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[\s-]/g, "")}`;
}

/** Turn phone numbers in plain text into `tel:` links. */
export function linkifyPhones(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(PHONE_RE)) {
    const phone = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push(text.slice(lastIndex, index));
    parts.push(
      <a
        key={`${index}-${phone}`}
        href={toTelHref(phone)}
        className="font-semibold text-tafnit-mint-700 underline underline-offset-2 hover:text-tafnit-navy-900"
      >
        {phone}
      </a>
    );
    lastIndex = index + phone.length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}
