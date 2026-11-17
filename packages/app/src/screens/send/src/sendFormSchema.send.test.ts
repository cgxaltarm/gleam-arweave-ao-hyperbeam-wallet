import { describe, expect, it } from "vitest";
import { amountSchema, recipientSchema } from "./sendFormSchema";

const ADDRESS = "a".repeat(43);

describe("recipientSchema", () => {
  it("accepts exactly a 43-character base64url address", () => {
    expect(recipientSchema.safeParse(ADDRESS).success).toBe(true);
  });

  it("trims surrounding whitespace", () => {
    expect(recipientSchema.safeParse(`  ${ADDRESS}  `).success).toBe(true);
  });

  it("rejects shorter and longer strings", () => {
    expect(recipientSchema.safeParse("a".repeat(42)).success).toBe(false);
    expect(recipientSchema.safeParse("a".repeat(44)).success).toBe(false);
  });

  it("rejects characters outside base64url", () => {
    expect(recipientSchema.safeParse(`${"a".repeat(42)}+`).success).toBe(false);
    expect(recipientSchema.safeParse(`${"a".repeat(42)}/`).success).toBe(false);
    expect(recipientSchema.safeParse(`${"a".repeat(42)}=`).success).toBe(false);
  });

  it("accepts the base64url characters - and _", () => {
    expect(recipientSchema.safeParse("-".repeat(43)).success).toBe(true);
    expect(recipientSchema.safeParse("_".repeat(43)).success).toBe(true);
  });
});

describe("amountSchema", () => {
  it("accepts a whole number", () => {
    expect(amountSchema(8).safeParse("12").success).toBe(true);
  });

  it("accepts at most `denomination` fraction digits", () => {
    expect(amountSchema(8).safeParse("1.12345678").success).toBe(true);
    expect(amountSchema(8).safeParse("1.123456789").success).toBe(false);
  });

  it("rejects zero", () => {
    expect(amountSchema(8).safeParse("0").success).toBe(false);
    expect(amountSchema(8).safeParse("0.0").success).toBe(false);
    expect(amountSchema(8).safeParse("0.00").success).toBe(false);
  });

  it("rejects non-numeric strings", () => {
    expect(amountSchema(8).safeParse("abc").success).toBe(false);
    expect(amountSchema(8).safeParse("1.2.3").success).toBe(false);
    expect(amountSchema(8).safeParse("").success).toBe(false);
  });

  it("respects a denomination of 1", () => {
    expect(amountSchema(1).safeParse("1.2").success).toBe(true);
    expect(amountSchema(1).safeParse("1.23").success).toBe(false);
  });
});
