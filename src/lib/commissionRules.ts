// Commission calculation rules - single source of truth for all commission logic

export interface CommissionConfig {
  // Platform fees
  platformFees: {
    nonMember: {
      under100: number;
      over100: number;
    };
    proMember: {
      under100: number;
      over100: number;
    };
    manualSurcharge: number;
  };
  
  // Commission ranges
  commissionRanges: {
    min: number;
    max: number;
    default: number;
  };
  
  // Special rules
  outsideReferrerFromHostShare: number; // 10% from host share for open chair
}

export const COMMISSION_CONFIG: CommissionConfig = {
  platformFees: {
    nonMember: {
      under100: 3,
      over100: 5
    },
    proMember: {
      under100: 2,
      over100: 3
    },
    manualSurcharge: 3
  },
  
  commissionRanges: {
    min: 15,
    max: 25,
    default: 20
  },
  
  outsideReferrerFromHostShare: 10
};

/**
 * Calculate platform fee based on service amount and membership
 */
export const calculatePlatformFee = (
  serviceAmount: number, 
  isPro: boolean = false, 
  isManual: boolean = false
): number => {
  const config = COMMISSION_CONFIG.platformFees;
  
  let baseFee: number;
  if (isPro) {
    baseFee = serviceAmount < 100 ? config.proMember.under100 : config.proMember.over100;
  } else {
    baseFee = serviceAmount < 100 ? config.nonMember.under100 : config.nonMember.over100;
  }
  
  return baseFee + (isManual ? config.manualSurcharge : 0);
};

/**
 * Calculate commission splits for Open Chair scenarios
 */
export const calculateOpenChairCommission = (
  serviceAmount: number,
  hostCommissionPct: number,
  hasOutsideReferrer: boolean = false,
  isPro: boolean = false,
  isManual: boolean = false
) => {
  const platformFee = calculatePlatformFee(serviceAmount, isPro, isManual);
  const hostCommissionAmount = (serviceAmount * hostCommissionPct) / 100;
  
  let hostAmount = hostCommissionAmount;
  let referrerAmount = 0;
  
  if (hasOutsideReferrer) {
    // Outside referrer gets 10% from host share
    referrerAmount = (hostCommissionAmount * COMMISSION_CONFIG.outsideReferrerFromHostShare) / 100;
    hostAmount = hostCommissionAmount - referrerAmount;
  }
  
  const stylistAmount = serviceAmount - hostCommissionAmount - platformFee;
  
  return {
    serviceAmount,
    platformFee,
    hostAmount,
    referrerAmount,
    stylistAmount,
    breakdown: {
      service: serviceAmount,
      platform: platformFee,
      host: hostAmount,
      referrer: referrerAmount,
      stylist: stylistAmount
    }
  };
};

/**
 * Calculate regular referral commission
 */
export const calculateReferralCommission = (
  serviceAmount: number,
  commissionPct: number,
  isPro: boolean = false,
  isManual: boolean = false
) => {
  const platformFee = calculatePlatformFee(serviceAmount, isPro, isManual);
  const commissionAmount = (serviceAmount * commissionPct) / 100;
  const stylistAmount = serviceAmount - commissionAmount - platformFee;
  
  return {
    serviceAmount,
    platformFee,
    commissionAmount,
    stylistAmount,
    breakdown: {
      service: serviceAmount,
      platform: platformFee,
      referrer: commissionAmount,
      stylist: stylistAmount
    }
  };
};

/**
 * Validate commission percentage is within allowed range
 */
export const validateCommissionPct = (pct: number): boolean => {
  const { min, max } = COMMISSION_CONFIG.commissionRanges;
  return pct >= min && pct <= max;
};

/**
 * Get default commission percentage
 */
export const getDefaultCommissionPct = (): number => {
  return COMMISSION_CONFIG.commissionRanges.default;
};