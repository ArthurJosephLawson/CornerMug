import dns from "node:dns";

/**
 * Gmail DNS verification. Confirms gmail.com's mail servers are resolvable —
 * i.e. the entry gate checks an authentic gmail domain, not a spoofable one.
 * The lookup is injectable so tests run without network access.
 */
export type MxRecord = { exchange: string; priority: number };
export type MxLookup = (domain: string) => Promise<MxRecord[]>;

export function defaultMxLookup(domain: string): Promise<MxRecord[]> {
  return dns.promises.resolveMx(domain);
}

export async function hasGmailMxRecords(
  lookup: MxLookup = defaultMxLookup,
): Promise<boolean> {
  try {
    const records = await lookup("gmail.com");
    return records.length > 0;
  } catch {
    return false;
  }
}
