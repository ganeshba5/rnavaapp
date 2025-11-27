/**
 * Activation Code Validation
 * Validates activation codes for user signup and determines subscription tier
 */

export type SubscriptionTier = 'Free' | 'Premium' | 'Enterprise';
export type UserRole = 'Admin' | 'Pet Owner' | 'Vet' | 'Dog Walker';

export interface ActivationCodeInfo {
  code: string;
  tier: SubscriptionTier;
  valid: boolean;
  allowedRoles?: UserRole[]; // Roles that can use this activation code
  description?: string;
}

/**
 * Valid activation codes and their associated tiers
 * More codes can be added for future promotions
 */
const VALID_ACTIVATION_CODES: Record<string, ActivationCodeInfo> = {
  'avapay': {
    code: 'avapay',
    tier: 'Free',
    valid: true,
    allowedRoles: ['Pet Owner'], // Only Pet Owner role can use this code
    description: 'Free tier access',
  },
  // Future activation codes can be added here:
  // 'promo2025': {
  //   code: 'promo2025',
  //   tier: 'Premium',
  //   valid: true,
  //   allowedRoles: ['Pet Owner', 'Vet'],
  //   description: 'Premium tier promotion',
  // },
};

/**
 * Validate an activation code (case insensitive)
 * @param code - The activation code to validate
 * @param role - Optional role to check if the code is allowed for that role
 * @returns ActivationCodeInfo object with validation result
 */
export function validateActivationCode(code: string, role?: UserRole): ActivationCodeInfo {
  if (!code || typeof code !== 'string') {
    return {
      code: code || '',
      tier: 'Free',
      valid: false,
      description: 'Invalid activation code',
    };
  }

  const normalizedCode = code.trim().toLowerCase();
  const activationCodeInfo = VALID_ACTIVATION_CODES[normalizedCode];

  if (activationCodeInfo) {
    // Check if role is allowed for this activation code
    if (role && activationCodeInfo.allowedRoles && !activationCodeInfo.allowedRoles.includes(role)) {
      return {
        ...activationCodeInfo,
        code: normalizedCode,
        valid: false,
        description: `This activation code is not valid for ${role} role`,
      };
    }
    return {
      ...activationCodeInfo,
      code: normalizedCode,
    };
  }

  return {
    code: normalizedCode,
    tier: 'Free',
    valid: false,
    description: 'Invalid activation code',
  };
}

/**
 * Get all valid activation codes (for admin/debugging purposes)
 */
export function getAllActivationCodes(): ActivationCodeInfo[] {
  return Object.values(VALID_ACTIVATION_CODES);
}

// Legacy export for backward compatibility
export const validateGiftCode = validateActivationCode;
export type GiftCodeInfo = ActivationCodeInfo;

