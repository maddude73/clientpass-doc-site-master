# Referral Adjustment System

## Overview

The Referral Adjustment System provides a comprehensive framework for modifying referral details after they've been created, including service changes, pricing adjustments, and duration modifications. It includes automated validation and confirmation workflows to ensure accuracy and fairness.

## Key Components

### AdjustReferralModal Component

**Location**: `src/components/referrals/AdjustReferralModal.tsx`

A modal interface for adjusting referral details with comprehensive validation and calculation features.

**Features**:

- **Service Modification**: Change or add services to existing referrals
- **Price Adjustment**: Modify service pricing with justification
- **Duration Updates**: Adjust estimated service duration
- **Validation Logic**: Ensure adjustments are within acceptable ranges
- **Approval Workflow**: Route significant changes for approval
- **Audit Trail**: Track all modifications for transparency

### EnhancedAdjustServiceModal Component

**Location**: `src/components/schedule/EnhancedAdjustServiceModal.tsx`

An improved version of the service adjustment modal with better UX and additional features.

**Enhancements**:

- Cleaner, more intuitive interface
- Real-time price recalculation
- Integration with service catalog
- Better error messaging
- Mobile-responsive design
- Undo/redo capability

### Service Adjustment Calculator

**Location**: `src/lib/serviceAdjustmentCalculator.ts`

A utility library for calculating adjustments, fees, and commissions related to service modifications.

**Functions**:

- `calculateAdjustment()`: Compute price and duration changes
- `validateAdjustment()`: Ensure changes are within limits
- `calculateFeeImpact()`: Determine how changes affect fees
- `calculateCommissionImpact()`: Compute commission adjustments
- `generateAdjustmentSummary()`: Create human-readable summary

### Auto-Confirm Adjustments Edge Function

**Location**: `supabase/functions/auto-confirm-adjustments/index.ts`

A serverless function that automatically confirms minor adjustments that meet predefined criteria.

**Purpose**:

- Reduce manual approval overhead for small changes
- Speed up the adjustment process
- Maintain consistency in approval logic
- Provide audit logging of auto-confirmations

## Adjustment Types

### 1. Service Modifications

**Add Service**:

- Client or Pro can add additional services to a referral
- Pricing automatically recalculated
- Duration updated based on service catalog
- Client notified of price change

**Remove Service**:

- Remove services from multi-service referrals
- Refund or credit issued if already paid
- Duration adjusted accordingly
- Requires client approval

**Replace Service**:

- Swap one service for another
- Price difference calculated
- Client approves or declines
- Original service marked as replaced

### 2. Price Adjustments

**Reasons for Price Adjustments**:

- Service complexity increased/decreased
- Additional materials or products required
- Time extension needed
- Client requested modifications
- Promotional discount application
- Error correction

**Adjustment Limits**:

- Minor adjustments (<10%): Auto-approved
- Moderate adjustments (10-25%): Requires reason
- Major adjustments (>25%): Requires approval from both parties

### 3. Duration Adjustments

**Scenarios**:

- Service took longer than estimated
- Multiple services combined efficiently
- Client late arrival requiring shortened service
- Technical difficulties

## User Workflows

### Pro: Adjusting a Referral

1. Navigate to active referral
2. Click "Adjust Services" button
3. AdjustReferralModal opens
4. Make desired changes:
   - Modify service list
   - Adjust pricing
   - Update duration
5. Provide reason for adjustment
6. Preview impact on fees and commissions
7. Submit adjustment
8. System determines if auto-approval applies
9. Client receives notification

### Client: Reviewing and Approving Adjustment

1. Receive notification of proposed adjustment
2. View adjustment details:
   - Original services vs. new services
   - Price comparison
   - Reason provided by Pro
3. Options:
   - **Approve**: Accept the adjustment
   - **Decline**: Reject and keep original terms
   - **Counter**: Propose alternative adjustment
4. Confirmation or negotiation continues

### System: Auto-Confirming Minor Adjustments

1. Pro submits adjustment
2. Edge function evaluates adjustment:
   - Check if within auto-approval thresholds
   - Verify no policy violations
   - Validate calculation accuracy
3. If criteria met:
   - Automatically approve
   - Update referral record
   - Notify both parties
4. If criteria not met:
   - Route for manual approval
   - Notify appropriate approver

## Technical Implementation

### Database Schema

**referral_adjustments Table**:

```sql
- id: UUID
- referral_id: UUID (foreign key)
- adjustment_type: TEXT (service_add, service_remove, price_change, duration_change)
- original_value: JSONB
- new_value: JSONB
- reason: TEXT
- requested_by: UUID (user_id)
- status: TEXT (pending, approved, declined, auto_approved)
- approved_by: UUID (nullable)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Validation Rules

**Price Adjustment Validation**:

```typescript
function validatePriceAdjustment(original, newPrice, reason) {
  const percentChange = ((newPrice - original) / original) * 100;

  if (Math.abs(percentChange) < 10) {
    return { autoApprove: true, requiresReason: false };
  } else if (Math.abs(percentChange) < 25) {
    return { autoApprove: false, requiresReason: true };
  } else {
    return { autoApprove: false, requiresReason: true, requiresApproval: true };
  }
}
```

### Fee Recalculation

When adjustments are made, the system recalculates:

1. **Platform Fee**: Based on new service price
2. **Pro Commission**: Adjusted for new total
3. **Payment Processor Fees**: Updated for new amount
4. **Net Payout**: Pro's adjusted earnings

## Auto-Confirmation Logic

### Criteria for Auto-Approval

An adjustment is automatically approved if ALL of the following are true:

1. **Price Change**: ≤10% of original price
2. **Duration Change**: ≤15 minutes from original
3. **Service Changes**: Only additions (no removals or replacements)
4. **Frequency**: Fewer than 3 adjustments on this referral
5. **Pro Status**: Good standing (no recent disputes)
6. **Client History**: No previous disputes with this pro

### Auto-Confirmation Process

```typescript
async function autoConfirmAdjustment(adjustmentId) {
  const adjustment = await getAdjustment(adjustmentId);
  const criteria = await evaluateCriteria(adjustment);

  if (criteria.eligible) {
    await updateAdjustmentStatus(adjustmentId, "auto_approved");
    await notifyParties(adjustment, "auto_approved");
    await recalculateFees(adjustment.referral_id);
    await logAuditEvent(adjustmentId, "auto_confirmed");
    return { success: true, method: "auto" };
  } else {
    await routeForManualApproval(adjustmentId);
    return { success: false, method: "manual", reasons: criteria.reasons };
  }
}
```

## Commission Rules Integration

**Location**: `src/lib/commissionRules.ts`

The adjustment system integrates with commission rules to ensure proper calculations:

**Updated Logic**:

- Recalculate pro commission on adjusted amounts
- Apply tiering rules to new totals
- Adjust platform fees proportionally
- Handle partial refunds correctly

## Benefits

1. **Flexibility**: Adapt to real-world service delivery situations
2. **Transparency**: Clear documentation of all changes
3. **Efficiency**: Auto-approval reduces wait times
4. **Fairness**: Both parties review significant changes
5. **Accuracy**: Automated calculations prevent errors

## Safety and Compliance

### Fraud Prevention

- Limit frequency of adjustments per referral
- Flag suspicious patterns (e.g., always adjusting up)
- Require photo evidence for certain adjustment types
- Review auto-approved adjustments periodically

### Dispute Resolution

- All adjustments are logged and auditable
- Original terms always preserved in database
- Clients can dispute adjustments within 48 hours
- Platform can review and reverse fraudulent adjustments

## Analytics and Reporting

### Metrics Tracked

- Average adjustment amount and percentage
- Most common adjustment reasons
- Auto-approval rate
- Time to approval for manual reviews
- Adjustment dispute rate

### Insights Generated

- Services frequently requiring adjustments
- Pros with high adjustment rates
- Pricing accuracy by service type
- Time estimation accuracy

## Future Enhancements

1. **Machine Learning**: Predict likely adjustments based on service type
2. **Dynamic Thresholds**: Adjust auto-approval limits based on pro history
3. **Bulk Adjustments**: Apply same adjustment to multiple referrals
4. **Templates**: Save common adjustment patterns
5. **Client Preferences**: Allow clients to pre-approve certain adjustment types

## Related Documentation

- [Referral System](CLIENT_REFERRAL.md)
- [Service Completion](SERVICE_COMPLETION.md)
- [Commission Rules](COMMISSION_RULES.md)
- [Fee Structure](FEE_BREAKDOWN.md)
- [Edge Functions](EDGE_FUNCTIONS.md)
