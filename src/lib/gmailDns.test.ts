import { describe, expect, it } from "vitest";
import { hasGmailMxRecords } from "./gmailDns";

describe("hasGmailMxRecords", () => {
  it("returns true when gmail.com resolves MX records", async () => {
    const lookup = async () => [{ exchange: "gmail-smtp-in.l.google.com.", priority: 5 }];
    expect(await hasGmailMxRecords(lookup)).toBe(true);
  });

  it("returns false when the DNS lookup fails", async () => {
    const lookup = async () => {
      throw new Error("NXDOMAIN");
    };
    expect(await hasGmailMxRecords(lookup)).toBe(false);
  });
});
