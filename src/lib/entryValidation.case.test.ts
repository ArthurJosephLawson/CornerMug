import { describe, expect, it } from "vitest";
import {
  isValidGmailFormat,
  validateEntryRequest,
} from "./entryValidation";

describe("isValidGmailFormat case handling", () => {
  it("accepts mixed-case gmail addresses", () => {
    expect(isValidGmailFormat("User.Name@GMAIL.com")).toBe(true);
    expect(isValidGmailFormat("USER@Gmail.Com")).toBe(true);
  });

  it("still rejects plus aliases in any case", () => {
    expect(isValidGmailFormat("USER+tag@Gmail.com")).toBe(false);
  });

  it("validateEntryRequest accepts mixed-case gmail", () => {
    expect(validateEntryRequest({ gmail: "Mug.Test@Gmail.com", username: "Mug_1" })).toEqual([]);
  });
});
