const CommissionHistory = require('../model/commissionHistory.model');
const VendorAgreement = require('../model/vendorAgreement.model');

const COMMISSION_RATE = 3; // 3%

const addCommissionCharge = async (userId, bookingId, baseAmount, paymentFrequency = 'per_booking') => {
  try {
    const amount = (baseAmount * COMMISSION_RATE) / 100;
    
    let dueDate = new Date();
    if (paymentFrequency === 'monthly') {
      // Due on 1st of next month
      dueDate = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 1);
    } else {
      // Due in 3 days for per_booking
      dueDate.setDate(dueDate.getDate() + 3);
    }

    const commission = new CommissionHistory({
      user: userId,
      booking: bookingId,
      amount,
      rate: COMMISSION_RATE,
      baseAmount,
      type: 'charged',
      paymentFrequency,
      dueDate,
      status: 'pending',
    });

    await commission.save();

    // Update outstanding commission in VendorAgreement
    await VendorAgreement.findOneAndUpdate(
      { user: userId },
      { 
        outstandingCommission: { $inc: amount },
        paymentNotificationSent: false 
      }
    );

    return commission;
  } catch (error) {
    console.error('Error adding commission charge:', error);
    throw error;
  }
};

const getCommissionHistory = async (userId, limit = 12, skip = 0) => {
  try {
    const history = await CommissionHistory.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await CommissionHistory.countDocuments({ user: userId });

    return {
      data: history,
      total,
      limit,
      skip,
    };
  } catch (error) {
    console.error('Error fetching commission history:', error);
    throw error;
  }
};

const getCommissionSummary = async (userId) => {
  try {
    const pendingCommissions = await CommissionHistory.find({
      user: userId,
      status: 'pending',
    }).lean();

    const paidCommissions = await CommissionHistory.find({
      user: userId,
      status: 'paid',
      type: 'paid',
    }).lean();

    const totalOutstanding = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);
    const totalPaid = paidCommissions.reduce((sum, c) => sum + c.amount, 0);
    const overdue = pendingCommissions.filter(c => new Date(c.dueDate) < new Date());

    return {
      totalOutstanding,
      totalPaid,
      pendingCount: pendingCommissions.length,
      paidCount: paidCommissions.length,
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((sum, c) => sum + c.amount, 0),
      lastPaymentDate: paidCommissions.length > 0 
        ? new Date(Math.max(...paidCommissions.map(c => new Date(c.paidDate))))
        : null,
    };
  } catch (error) {
    console.error('Error fetching commission summary:', error);
    throw error;
  }
};

const getMonthlyCommissionSummary = async (userId, months = 6) => {
  try {
    const monthlyData = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);

      const commissions = await CommissionHistory.find({
        user: userId,
        createdAt: { $gte: date, $lt: nextMonth },
      }).lean();

      const charged = commissions
        .filter(c => c.type === 'charged')
        .reduce((sum, c) => sum + c.amount, 0);

      const paid = commissions
        .filter(c => c.type === 'paid' && c.status === 'paid')
        .reduce((sum, c) => sum + c.amount, 0);

      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthDate: date,
        charged,
        paid,
        pending: charged - paid,
      });
    }

    return monthlyData;
  } catch (error) {
    console.error('Error fetching monthly commission summary:', error);
    throw error;
  }
};

const recordCommissionPayment = async (userId, amount, paymentProof = null) => {
  try {
    // Get pending commissions
    const pending = await CommissionHistory.find({
      user: userId,
      status: 'pending',
      type: 'charged',
    })
      .sort({ dueDate: 1 })
      .lean();

    let remainingAmount = amount;
    const paidIds = [];

    for (const commission of pending) {
      if (remainingAmount <= 0) break;

      if (commission.amount <= remainingAmount) {
        // Fully pay this commission
        await CommissionHistory.findByIdAndUpdate(commission._id, {
          type: 'paid',
          status: 'paid',
          paidDate: new Date(),
          'paymentProof.screenshotUrl': paymentProof?.screenshotUrl || null,
          'paymentProof.transactionId': paymentProof?.transactionId || null,
          'paymentProof.uploadedAt': paymentProof ? new Date() : null,
          'paymentProof.verificationStatus': paymentProof ? 'pending' : 'verified',
        });

        remainingAmount -= commission.amount;
        paidIds.push(commission._id);
      } else {
        // Partially pay this commission
        await CommissionHistory.findByIdAndUpdate(commission._id, {
          amount: commission.amount - remainingAmount,
          status: 'partially_paid',
        });

        remainingAmount = 0;
        break;
      }
    }

    // Update outstanding commission in VendorAgreement
    const totalPaid = paidIds.reduce((sum, id) => {
      const commission = pending.find(c => c._id.toString() === id.toString());
      return sum + (commission?.amount || 0);
    }, 0);

    await VendorAgreement.findOneAndUpdate(
      { user: userId },
      { 
        $inc: { outstandingCommission: -totalPaid },
        lastPaymentDate: new Date(),
        paymentNotificationSent: false,
      }
    );

    return {
      paidAmount: amount - remainingAmount,
      remainingAmount,
      paidCommissions: paidIds.length,
    };
  } catch (error) {
    console.error('Error recording commission payment:', error);
    throw error;
  }
};

const getOverdueCommissions = async (userId) => {
  try {
    const now = new Date();
    const overdue = await CommissionHistory.find({
      user: userId,
      status: 'pending',
      dueDate: { $lt: now },
    })
      .sort({ dueDate: 1 })
      .lean();

    return overdue;
  } catch (error) {
    console.error('Error fetching overdue commissions:', error);
    throw error;
  }
};

module.exports = {
  addCommissionCharge,
  getCommissionHistory,
  getCommissionSummary,
  getMonthlyCommissionSummary,
  recordCommissionPayment,
  getOverdueCommissions,
};
