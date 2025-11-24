# Key Generation Guide

This guide explains how to generate the required security keys for the LMS Platform.

## Required Keys

The following keys are required in your `.env` file:

1. **CSRF_SECRET** - CSRF Protection Key
2. **ENCRYPTION_KEY** - Encryption Key for sensitive data
3. **SUPER_ADMIN_REGISTRATION_CODE** - Code required to register super admin accounts

All keys must be:
- **Minimum 32 characters long** (recommended: 64 characters)
- **Cryptographically secure random strings**
- **Unique for each environment** (development, staging, production)

---

## Method 1: Using the Key Generation Script (Recommended)

The easiest way to generate all keys at once:

```bash
# From the project root
cd backend
node scripts/generate-keys.js
```

This will generate all three keys and display them. Simply copy them to your `.env` file.

---

## Method 2: Using Node.js (One-liner)

You can generate keys individually using Node.js:

### Generate CSRF_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Generate ENCRYPTION_KEY:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Generate SUPER_ADMIN_REGISTRATION_CODE:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Method 3: Using OpenSSL (Command Line)

If you have OpenSSL installed:

### Generate CSRF_SECRET:
```bash
openssl rand -hex 32
```

### Generate ENCRYPTION_KEY:
```bash
openssl rand -hex 32
```

### Generate SUPER_ADMIN_REGISTRATION_CODE:
```bash
openssl rand -hex 32
```

---

## Method 4: Using PowerShell (Windows)

For Windows PowerShell:

```powershell
# Generate a 64-character hex string (32 bytes)
[Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Or using .NET:

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToHexString($bytes)
```

---

## Method 5: Using Python

If you have Python installed:

```python
import secrets
print(secrets.token_hex(32))  # Generates 64-character hex string
```

Run it:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Method 6: Online Generators (Use with Caution)

⚠️ **WARNING**: Only use trusted online generators for development. **NEVER** use online generators for production keys.

Some trusted options:
- [RandomKeygen](https://randomkeygen.com/) - Use the "CodeIgniter Encryption Keys" option
- [1Password Secret Key Generator](https://1password.com/password-generator/) - Set length to 64 characters

---

## Example .env Configuration

After generating your keys, add them to `backend/.env`:

```env
# CSRF Protection
CSRF_SECRET=your_generated_csrf_secret_key_here_64_characters_long

# Encryption Key (REQUIRED - minimum 32 characters)
ENCRYPTION_KEY=your_generated_encryption_key_here_64_characters_long

# Super Admin Registration
# WARNING: Change this code in production! This is just an example.
SUPER_ADMIN_REGISTRATION_CODE=your_generated_super_admin_code_here_64_characters
```

---

## Security Best Practices

1. **Never commit keys to version control**
   - Ensure `.env` is in `.gitignore`
   - Use `.env.example` for templates (without real keys)

2. **Use different keys for each environment**
   - Development keys should differ from production keys
   - Staging should have its own set of keys

3. **Rotate keys periodically**
   - Change keys if they may have been compromised
   - Plan key rotation for production environments

4. **Store production keys securely**
   - Use environment variables in your hosting platform
   - Use secret management services (AWS Secrets Manager, Azure Key Vault, etc.)
   - Never hardcode keys in source code

5. **Key Length**
   - Minimum: 32 characters
   - Recommended: 64 characters (32 bytes in hex)
   - Longer keys provide better security but are harder to manage

---

## Verification

After setting your keys, verify they're loaded correctly:

1. Start your backend server
2. Check the console for any warnings about key length
3. The server should start without errors if all required keys are set

If you see errors like:
- `ENCRYPTION_KEY environment variable is required`
- `CSRF_SECRET should be at least 32 characters long`

Then you need to set or regenerate the keys.

---

## Troubleshooting

### Issue: "ENCRYPTION_KEY is required"
**Solution**: Make sure `ENCRYPTION_KEY` is set in your `.env` file and the file is in the `backend/` directory.

### Issue: "Key should be at least 32 characters"
**Solution**: Regenerate the key using one of the methods above. The generated keys should be 64 characters long (32 bytes in hexadecimal).

### Issue: Keys not loading
**Solution**: 
1. Ensure your `.env` file is in the `backend/` directory
2. Restart your server after updating `.env`
3. Check for typos in variable names (they're case-sensitive)

---

## Quick Reference

| Key Name | Purpose | Minimum Length | Recommended Length |
|----------|---------|----------------|-------------------|
| `CSRF_SECRET` | CSRF token generation | 32 chars | 64 chars |
| `ENCRYPTION_KEY` | Data encryption | 32 chars | 64 chars |
| `SUPER_ADMIN_REGISTRATION_CODE` | Super admin registration | 32 chars | 64 chars |

---

## Need Help?

If you encounter issues:
1. Check the `backend/env.example` file for the correct variable names
2. Verify your `.env` file is in the correct location (`backend/.env`)
3. Ensure no extra spaces or quotes around the key values
4. Restart your server after making changes



