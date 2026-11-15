import { describe, expect, it } from "vitest";
import {
  isValidGmailFormat,
  isValidUsername,
  validateEntryRequest,
} from "./entryValidation";

describe("isValidGmailFormat", () => {
  it("accepts a standard gmail address", () => {
    expect(isValidGmailFormat("user.name@gmail.com")).toBe(true);
  });

  it("accepts dots and digits in the local part", () => {
    expect(isValidGmailFormat("a1.b2@gmail.com")).toBe(true);
  });

  it("rejects non-gmail domains", () => {
    expect(isValidGmailFormat("user@yahoo.com")).toBe(false);
    expect(isValidGmailFormat("user@gmail.co")).toBe(false);
    expect(isValidGmailFormat("user@gmail.com.evil.com")).toBe(false);
  });

  it("rejects plus aliases", () => {
    expect(isValidGmailFormat("user+tag@gmail.com")).toBe(false);
  });

  it("rejects leading dot", () => {
    expect(isValidGmailFormat(".user@gmail.com")).toBe(false);
  });

  it("rejects trailing dot", () => {
    expect(isValidGmailFormat("user.@gmail.com")).toBe(false);
  });

  it("rejects consecutive dots", () => {
    expect(isValidGmailFormat("us..er@gmail.com")).toBe(false);
  });

  it("rejects missing local part", () => {
    expect(isValidGmailFormat("@gmail.com")).toBe(false);
  });

  it("rejects empty and malformed input", () => {
    expect(isValidGmailFormat("")).toBe(false);
    expect(isValidGmailFormat("not-an-email")).toBe(false);
    expect(isValidGmailFormat("user@gmail")).toBe(false);
  });
});

describe("isValidUsername", () => {
  it("accepts 3 to 16 alphanumeric/underscore characters", () => {
    expect(isValidUsername("abc")).toBe(true);
    expect(isValidUsername("User_3")).toBe(true);
    expect(isValidUsername("0123456789abcdef")).toBe(true);
  });

  it("rejects too-short usernames", () => {
    expect(isValidUsername("ab")).toBe(false);
  });

  it("rejects too-long usernames", () => {
    expect(isValidUsername("0123456789abcdefg")).toBe(false);
  });

  it("rejects spaces, dashes, and non-ASCII", () => {
    expect(isValidUsername("has space")).toBe(false);
    expect(isValidUsername("has-dash")).toBe(false);
    expect(isValidUsername("héllo")).toBe(false);
  });
});

describe("validateEntryRequest", () => {
  it("returns no errors for a valid request", () => {
    expect(validateEntryRequest({ gmail: "user@gmail.com", username: "Mug_1" })).toEqual([]);
  });

  it("reports both errors at once for an invalid request", () => {
    const errors = validateEntryRequest({ gmail: "a@b.com", username: "x" });
    expect(errors).toHaveLength(2);
  });
});
