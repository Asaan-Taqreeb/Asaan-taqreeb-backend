const VendorAgreement = require('../model/vendorAgreement.model');

const DEFAULT_AGREEMENT_TEXT = `
VENDOR COMMISSION AGREEMENT

This agreement outlines the commission structure between Asaan Taqreeb and our vendor partners.

1. COMMISSION RATE:
   - Commission Rate: 5% of every booking amount
   - Commission is calculated on the total amount charged to the customer

2. PAYMENT PROCESS:
   - You will be provided with our bank details
   - Please transfer the commission amount and attach a screenshot as proof
   - We will verify and confirm receipt of payment

3. OUTSTANDING COMMISSION:
   - If commission is not paid on time, you will receive a notification reminder
   - Failure to pay outstanding commission may result in account suspension or termination
   - We maintain the right to suspend your account if payments are consistently overdue

4. COMMISSION TRACKING:
   - Your commission dashboard will show:
     * Outstanding commission (unpaid)
     * Commission history
     * Previous payments
     * Due dates

5. TERMINATION:
   - Non-payment of commissions may lead to immediate account deactivation
   - We will attempt to contact you before taking any action

By accepting this agreement, you acknowledge and agree to all terms outlined above.
`;

const getAgreementByUserId = async (userId) => {
  try {
    const agreement = await VendorAgreement.findOne({ user: userId });
    return agreement;
  } catch (error) {
    console.error('Error fetching agreement:', error);
    throw error;
  }
};

const createAgreement = async (userId) => {
  try {
    // Check if agreement already exists
    const existing = await VendorAgreement.findOne({ user: userId });
    if (existing) {
      return existing;
    }

    const agreement = new VendorAgreement({
      user: userId,
      commissionRate: 5,
      agreementText: DEFAULT_AGREEMENT_TEXT,
      accepted: false,
      status: 'pending',
    });

    await agreement.save();
    return agreement;
  } catch (error) {
    console.error('Error creating agreement:', error);
    throw error;
  }
};

const acceptAgreement = async (userId) => {
  try {
    let agreement = await VendorAgreement.findOne({ user: userId });

    if (!agreement) {
      agreement = await createAgreement(userId);
    }

    agreement.accepted = true;
    agreement.status = 'accepted';
    agreement.acceptedAt = new Date();
    agreement.commissionRate = 5;

    await agreement.save();
    return agreement;
  } catch (error) {
    console.error('Error accepting agreement:', error);
    throw error;
  }
};

const rejectAgreement = async (userId) => {
  try {
    let agreement = await VendorAgreement.findOne({ user: userId });

    if (!agreement) {
      agreement = await createAgreement(userId);
    }

    agreement.status = 'rejected';
    await agreement.save();
    return agreement;
  } catch (error) {
    console.error('Error rejecting agreement:', error);
    throw error;
  }
};

const getAgreementText = () => {
  return DEFAULT_AGREEMENT_TEXT;
};

const addCommission = async (userId, amount) => {
  try {
    const agreement = await VendorAgreement.findOne({ user: userId });
    if (!agreement) {
      throw new Error('Agreement not found for this vendor');
    }

    agreement.outstandingCommission += amount;
    agreement.paymentNotificationSent = false;
    await agreement.save();
    return agreement;
  } catch (error) {
    console.error('Error adding commission:', error);
    throw error;
  }
};

const recordCommissionPayment = async (userId, amount) => {
  try {
    const agreement = await VendorAgreement.findOne({ user: userId });
    if (!agreement) {
      throw new Error('Agreement not found for this vendor');
    }

    if (agreement.outstandingCommission < amount) {
      throw new Error('Payment amount exceeds outstanding commission');
    }

    agreement.outstandingCommission -= amount;
    agreement.lastPaymentDate = new Date();
    agreement.paymentNotificationSent = false;
    await agreement.save();
    return agreement;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

const getOutstandingCommission = async (userId) => {
  try {
    const agreement = await VendorAgreement.findOne({ user: userId });
    if (!agreement) {
      return 0;
    }
    return agreement.outstandingCommission;
  } catch (error) {
    console.error('Error fetching outstanding commission:', error);
    throw error;
  }
};

module.exports = {
  getAgreementByUserId,
  createAgreement,
  acceptAgreement,
  rejectAgreement,
  getAgreementText,
  addCommission,
  recordCommissionPayment,
  getOutstandingCommission,
};
