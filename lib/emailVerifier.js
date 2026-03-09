const dns = require("dns").promises;
const SMTPConnection = require("smtp-connection");

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const commonDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];

function getDidYouMean(email) {
  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1) return null;
  const domain = email.substring(atIndex + 1).toLowerCase();
  let minDistance = Infinity;
  let suggestion = null;
  for (const common of commonDomains) {
    const dist = levenshteinDistance(domain, common);
    if (dist > 0 && dist <= 2 && dist < minDistance) {
      minDistance = dist;
      suggestion = email.substring(0, atIndex) + "@" + common;
    }
  }
  return suggestion;
}

async function verifyEmail(email) {
  const startTime = Date.now();
  const result = {
    email,
    result: "unknown",
    resultcode: 3,
    subresult: "unknown",
    domain: "",
    mxRecords: [],
    executiontime: 0,
    error: null,
    timestamp: new Date().toISOString(),
  };

  try {
    // Validate syntax
    const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email) || email.length > 254) {
      result.result = "invalid";
      result.resultcode = 6;
      result.subresult = "invalid_syntax";
      return result;
    }

    const atIndex = email.lastIndexOf("@");
    const domain = email.substring(atIndex + 1).toLowerCase();
    result.domain = domain;

    // Check for typo
    const suggestion = getDidYouMean(email);
    if (suggestion) {
      result.didyoumean = suggestion;
      result.result = "invalid";
      result.resultcode = 6;
      result.subresult = "typo_detected";
      return result;
    }

    // DNS MX lookup
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      result.result = "invalid";
      result.resultcode = 6;
      result.subresult = "no_mx_records";
      return result;
    }
    mxRecords.sort((a, b) => a.priority - b.priority);
    result.mxRecords = mxRecords.map((mx) => mx.exchange);

    // Try SMTP connection
    for (const mx of mxRecords) {
      try {
        const connection = new SMTPConnection({
          host: mx.exchange,
          port: 25,
          secure: false,
          tls: { rejectUnauthorized: false },
          timeout: 10000,
        });

        await new Promise((resolve, reject) => {
          connection.connect((err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // Send HELO
        await new Promise((resolve, reject) => {
          connection.helo("example.com", (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // Send MAIL FROM
        await new Promise((resolve, reject) => {
          connection.mail("test@example.com", (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // Send RCPT TO
        await new Promise((resolve, reject) => {
          connection.rcpt(email, (err, code, reply) => {
            connection.quit();
            if (err) {
              if (code === 550) {
                result.result = "invalid";
                result.resultcode = 6;
                result.subresult = "mailbox_does_not_exist";
              } else if (code === 450 || code === 451) {
                result.result = "unknown";
                result.resultcode = 3;
                result.subresult = "greylisted";
              } else {
                result.result = "unknown";
                result.resultcode = 3;
                result.subresult = "smtp_error";
              }
            } else {
              result.result = "valid";
              result.resultcode = 1;
              result.subresult = "mailbox_exists";
            }
            resolve();
          });
        });

        break; // Success with this MX
      } catch (smtpErr) {
        // Try next MX
        continue;
      }
    }

    if (result.result === "unknown") {
      result.subresult = "connection_error";
    }
  } catch (err) {
    result.error = err.message;
    result.result = "invalid";
    result.resultcode = 6;
    if (err.code === "ENOTFOUND") {
      result.subresult = "no_mx_records";
    } else {
      result.subresult = "dns_error";
    }
  }

  result.executiontime = Math.round((Date.now() - startTime) / 1000);
  return result;
}

module.exports = { verifyEmail, getDidYouMean };
