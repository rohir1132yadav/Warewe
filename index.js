const { verifyEmail, getDidYouMean } = require("./lib/emailVerifier");

async function main() {
  const testEmails = [
    "user@gmial.com",
    "invalidemail",
    "user@nonexistentdomain12345.com",
  ];

  for (const email of testEmails) {
    console.log(`Verifying: ${email}`);
    try {
      const result = await verifyEmail(email);
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.log("Error:", err.message);
    }
    console.log("---");
  }

  console.log("Did you mean for gmial.com:", getDidYouMean("user@gmial.com"));
}

main().catch(console.error);
