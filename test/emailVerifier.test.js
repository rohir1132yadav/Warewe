const { verifyEmail, getDidYouMean } = require("../lib/emailVerifier");
jest.setTimeout(15000);
describe("Email Verification Module", () => {
  describe("getDidYouMean", () => {
    test("should suggest gmail.com for gmial.com", () => {
      expect(getDidYouMean("user@gmial.com")).toBe("user@gmail.com");
    });

    test("should suggest yahoo.com for yahooo.com", () => {
      expect(getDidYouMean("user@yahooo.com")).toBe("user@yahoo.com");
    });

    test("should suggest hotmail.com for hotmial.com", () => {
      expect(getDidYouMean("user@hotmial.com")).toBe("user@hotmail.com");
    });

    test("should suggest outlook.com for outlok.com", () => {
      expect(getDidYouMean("user@outlok.com")).toBe("user@outlook.com");
    });

    test("should return null for correct domain", () => {
      expect(getDidYouMean("user@gmail.com")).toBeNull();
    });

    test("should return null for invalid email", () => {
      expect(getDidYouMean("invalid")).toBeNull();
    });
  });

  describe("verifyEmail", () => {
    test("should reject invalid syntax - missing @", async () => {
      const result = await verifyEmail("invalidemail.com");
      expect(result.result).toBe("invalid");
      expect(result.resultcode).toBe(6);
      expect(result.subresult).toBe("invalid_syntax");
    });

    test("should reject invalid syntax - double dots", async () => {
      const result = await verifyEmail("user@domain..com");
      expect(result.result).toBe("invalid");
      expect(result.resultcode).toBe(6);
      expect(result.subresult).toBe("invalid_syntax");
    });

    test("should reject invalid syntax - multiple @", async () => {
      const result = await verifyEmail("user@domain@com");
      expect(result.result).toBe("invalid");
      expect(result.resultcode).toBe(6);
      expect(result.subresult).toBe("invalid_syntax");
    });

    test("should detect typo and suggest correction", async () => {
      const result = await verifyEmail("user@gmial.com");
      expect(result.result).toBe("invalid");
      expect(result.resultcode).toBe(6);
      expect(result.subresult).toBe("typo_detected");
      expect(result.didyoumean).toBe("user@gmail.com");
    });

    test("should handle empty string", async () => {
      const result = await verifyEmail("");
      expect(result.result).toBe("invalid");
      expect(result.resultcode).toBe(6);
      expect(result.subresult).toBe("invalid_syntax");
    });

    test("should handle null", async () => {
      const result = await verifyEmail(null);
      expect(result.result).toBe("invalid");
      expect(result.resultcode).toBe(6);
      expect(result.subresult).toBe("invalid_syntax");
    });

    test("should handle undefined", async () => {
      const result = await verifyEmail(undefined);
      expect(result.result).toBe("invalid");
      expect(result.resultcode).toBe(6);
      expect(result.subresult).toBe("invalid_syntax");
    });

    test("should handle very long email", async () => {
      const longEmail = "a".repeat(1000) + "@example.com";
      const result = await verifyEmail(longEmail);
      expect(result.result).toBe("invalid");
      expect(result.subresult).toBe("invalid_syntax");
    });

    test("should handle domain with no MX records", async () => {
      const result = await verifyEmail("user@nonexistentdomain12345.com");
      expect(result.result).toBe("invalid");
      expect(result.resultcode).toBe(6);
      expect(result.subresult).toBe("no_mx_records");
    });

    // Mock tests for SMTP (since we can't actually connect in tests)
    // For real tests, we'd need to mock the SMTP connection

    test("should have correct structure for invalid email", async () => {
      const result = await verifyEmail("invalid");
      expect(result).toHaveProperty("email");
      expect(result).toHaveProperty("result");
      expect(result).toHaveProperty("resultcode");
      expect(result).toHaveProperty("subresult");
      expect(result).toHaveProperty("domain");
      expect(result).toHaveProperty("mxRecords");
      expect(result).toHaveProperty("executiontime");
      expect(result).toHaveProperty("error");
      expect(result).toHaveProperty("timestamp");
      expect(typeof result.executiontime).toBe("number");
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test("should handle DNS error", async () => {
      // Mock DNS error if possible, but for now, test with invalid domain
      const result = await verifyEmail("user@.com");
      expect(result.result).toBe("invalid");
      expect(result.subresult).toBe("invalid_syntax");
    });

    // Additional edge cases
    test("should reject email with spaces", async () => {
      const result = await verifyEmail("user @example.com");
      expect(result.result).toBe("invalid");
      expect(result.subresult).toBe("invalid_syntax");
    });

    test("should reject email starting with @", async () => {
      const result = await verifyEmail("@example.com");
      expect(result.result).toBe("invalid");
      expect(result.subresult).toBe("invalid_syntax");
    });

    test("should reject email ending with @", async () => {
      const result = await verifyEmail("user@");
      expect(result.result).toBe("invalid");
      expect(result.subresult).toBe("invalid_syntax");
    });

    test("should handle valid syntax but invalid domain", async () => {
      const result = await verifyEmail("user@invalid.domain");
      expect(result.result).toBe("invalid");
      expect(result.subresult).toBe("no_mx_records");
    });
  });
});
