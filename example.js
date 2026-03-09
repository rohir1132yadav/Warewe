const { verifyEmail, getDidYouMean } = require("./lib/emailVerifier");

async function example() {
  // Example 1: Verify a potentially valid email
  console.log("=== Example 1: Valid syntax but invalid domain ===");
  const result1 = await verifyEmail("test@nonexistentdomain12345.com");
  console.log(JSON.stringify(result1, null, 2));

  // Example 2: Check for typos
  console.log("\n=== Example 2: Typo detection ===");
  const suggestion = getDidYouMean("user@hotmial.com");
  console.log("Suggestion for hotmial.com:", suggestion);

  // Example 3: Invalid syntax
  console.log("\n=== Example 3: Invalid syntax ===");
  const result3 = await verifyEmail("invalid-email-format");
  console.log(JSON.stringify(result3, null, 2));
}

example().catch(console.error);
