# Email Verification Module

A Node.js module for verifying email addresses using SMTP protocol with typo detection.

## Features

- **Email Syntax Validation**: Validates email format using regex
- **DNS MX Lookup**: Performs DNS lookup for mail exchange records
- **SMTP Verification**: Connects to SMTP server and checks mailbox existence using RCPT TO command
- **Typo Detection**: Suggests corrections for common domain typos using Levenshtein distance
- **Comprehensive Error Handling**: Handles various error scenarios gracefully
- **Unit Tests**: Extensive test coverage with Jest

## Installation

```bash
npm install
```

## Usage

```javascript
const { verifyEmail, getDidYouMean } = require('./lib/emailVerifier');

async function main() {
    // Verify an email
    const result = await verifyEmail('user@example.com');
    console.log(result);

    // Check for typos
    const suggestion = getDidYouMean('user@gmial.com');
    console.log(suggestion); // 'user@gmail.com'
}

main();
```

## API

### verifyEmail(email)

Verifies an email address and returns a detailed result object.

**Parameters:**
- `email` (string): The email address to verify

**Returns:** Promise resolving to an object with the following structure:
```javascript
{
    email: "user@example.com",
    result: "valid" | "invalid" | "unknown",
    resultcode: 1 | 3 | 6,
    subresult: string, // e.g., "mailbox_exists", "mailbox_does_not_exist", "typo_detected", etc.
    domain: "example.com",
    mxRecords: ["mx1.example.com", "mx2.example.com"],
    executiontime: 2, // seconds
    error: null | "error message",
    timestamp: "2026-02-11T10:30:00.000Z",
    didyoumean: "user@gmail.com" // optional, present if typo detected
}
```

**Result Codes:**
- `1`: Valid (mailbox exists)
- `3`: Unknown (temporary issues like greylisting or connection errors)
- `6`: Invalid (syntax error, no MX records, mailbox doesn't exist, or typo detected)

### getDidYouMean(email)

Suggests corrections for common domain typos.

**Parameters:**
- `email` (string): The email address to check

**Returns:** string | null - The suggested correction or null if no suggestion

**Supported Corrections:**
- gmial.com → gmail.com
- yahooo.com → yahoo.com
- hotmial.com → hotmail.com
- outlok.com → outlook.com

## Testing

Run the test suite:

```bash
npm test
```

The module includes 21 comprehensive unit tests covering:
- Syntax validation (valid/invalid formats)
- Typo detection
- Error handling (null, undefined, empty strings, long emails)
- DNS and SMTP error scenarios
- Result structure validation

## Dependencies

- `smtp-connection`: For SMTP connections
- `jest`: For testing (dev dependency)

## License

MIT