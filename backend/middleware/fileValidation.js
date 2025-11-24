import fs from 'fs';

// CRITICAL FIX: File content validation using magic numbers
// Magic numbers are the first few bytes of a file that identify its type

const FILE_SIGNATURES = {
  // Images
  'image/jpeg': [
    Buffer.from([0xFF, 0xD8, 0xFF])
  ],
  'image/png': [
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
  ],
  'image/gif': [
    Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), // GIF87a
    Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])  // GIF89a
  ],
  'image/webp': [
    Buffer.from([0x52, 0x49, 0x46, 0x46]) // RIFF (first 4 bytes)
  ],
  
  // Documents
  'application/pdf': [
    Buffer.from([0x25, 0x50, 0x44, 0x46]) // %PDF
  ],
  'application/msword': [
    Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]) // MS Office 97-2003
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    Buffer.from([0x50, 0x4B, 0x03, 0x04]) // ZIP (Office 2007+)
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    Buffer.from([0x50, 0x4B, 0x03, 0x04]) // ZIP (Office 2007+)
  ],
  'application/vnd.ms-excel': [
    Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]) // MS Office 97-2003
  ],
  
  // Text
  'text/plain': [
    // Plain text doesn't have a magic number, will need to check content
  ],
  
  // Archives
  'application/zip': [
    Buffer.from([0x50, 0x4B, 0x03, 0x04]),
    Buffer.from([0x50, 0x4B, 0x05, 0x06]),
    Buffer.from([0x50, 0x4B, 0x07, 0x08])
  ]
};

/**
 * Validate file content using magic numbers
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} expectedMimeType - The expected MIME type
 * @returns {boolean} - True if file content matches expected type
 */
export const validateFileContent = (fileBuffer, expectedMimeType) => {
  if (!fileBuffer || fileBuffer.length === 0) {
    return false;
  }

  const signatures = FILE_SIGNATURES[expectedMimeType];
  
  if (!signatures || signatures.length === 0) {
    // No magic number defined for this type, allow it (for text files)
    // But log a warning
    console.warn(`No magic number validation for MIME type: ${expectedMimeType}`);
    return true;
  }

  // Check if file matches any of the expected signatures
  for (const signature of signatures) {
    if (fileBuffer.length >= signature.length) {
      const fileHeader = fileBuffer.slice(0, signature.length);
      if (fileHeader.equals(signature)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Middleware to validate uploaded file content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const validateUploadedFile = (req, res, next) => {
  if (!req.file) {
    return next(); // No file to validate
  }

  const file = req.file;
  const fileBuffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
  
  if (!fileBuffer) {
    return res.status(400).json({
      success: false,
      message: 'File buffer not available for validation'
    });
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (fileBuffer.length > maxSize) {
    return res.status(400).json({
      success: false,
      message: 'File size exceeds maximum allowed size (10MB)'
    });
  }

  // Validate file content using magic numbers
  if (!validateFileContent(fileBuffer, file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: `File content does not match declared MIME type (${file.mimetype}). File may be corrupted or malicious.`
    });
  }

  next();
};

/**
 * Get allowed MIME types for question attachments
 */
export const getAllowedMimeTypes = () => {
  return [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain',
    'application/zip'
  ];
};

