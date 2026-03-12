const { verifyEmail, getDidYouMean } = require("../lib/emailVerifier");

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const result = await verifyEmail(email);
    const suggestion = getDidYouMean(email);

    return res.status(200).json({
      email,
      verification: result,
      suggestion: suggestion,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
