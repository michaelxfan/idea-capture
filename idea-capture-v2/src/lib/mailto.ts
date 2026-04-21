/**
 * Builds a properly encoded mailto: link.
 * Only includes query params that have non-empty values.
 */
export function buildMailtoLink({
  to = "",
  cc = "",
  bcc = "",
  subject = "",
  body = "",
}: {
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
}): string {
  const params: string[] = [];

  if (cc.trim()) params.push(`cc=${encodeURIComponent(cc.trim())}`);
  if (bcc.trim()) params.push(`bcc=${encodeURIComponent(bcc.trim())}`);
  if (subject.trim()) params.push(`subject=${encodeURIComponent(subject.trim())}`);
  if (body.trim()) params.push(`body=${encodeURIComponent(body.trim())}`);

  const query = params.length > 0 ? `?${params.join("&")}` : "";
  return `mailto:${encodeURIComponent(to.trim())}${query}`;
}
