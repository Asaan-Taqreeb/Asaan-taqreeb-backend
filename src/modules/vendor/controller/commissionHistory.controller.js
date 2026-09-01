const commissionHistoryService = require('../service/commissionHistory.service');

const getCommissionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 12, skip = 0 } = req.query;

    const result = await commissionHistoryService.getCommissionHistory(
      userId,
      parseInt(limit),
      parseInt(skip)
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching commission history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching commission history',
      error: error.message,
    });
  }
};

const getCommissionSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const summary = await commissionHistoryService.getCommissionSummary(userId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching commission summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching commission summary',
      error: error.message,
    });
  }
};

const getMonthlyCommissionSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { months = 6 } = req.query;

    const monthlySummary = await commissionHistoryService.getMonthlyCommissionSummary(
      userId,
      parseInt(months)
    );

    res.status(200).json({
      success: true,
      data: monthlySummary,
    });
  } catch (error) {
    console.error('Error fetching monthly commission summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly commission summary',
      error: error.message,
    });
  }
};

const getOverdueCommissions = async (req, res) => {
  try {
    const userId = req.user._id;

    const overdue = await commissionHistoryService.getOverdueCommissions(userId);

    res.status(200).json({
      success: true,
      data: overdue,
      count: overdue.length,
    });
  } catch (error) {
    console.error('Error fetching overdue commissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overdue commissions',
      error: error.message,
    });
  }
};

module.exports = {
  getCommissionHistory,
  getCommissionSummary,
  getMonthlyCommissionSummary,
  getOverdueCommissions,
};
