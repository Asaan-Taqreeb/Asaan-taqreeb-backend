const vendorAgreementService = require('../service/vendorAgreement.service');

const getAgreement = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const agreement = await vendorAgreementService.getAgreementByUserId(userId);

    if (!agreement) {
      return res.status(404).json({
        success: false,
        error: 'Agreement not found',
      });
    }

    res.status(200).json({
      success: true,
      data: agreement,
    });
  } catch (error) {
    console.error('Error in getAgreement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agreement',
    });
  }
};

const getAgreementText = async (req, res) => {
  try {
    const text = vendorAgreementService.getAgreementText();
    res.status(200).json({
      success: true,
      data: {
        text: text,
        commissionRate: 5,
      },
    });
  } catch (error) {
    console.error('Error in getAgreementText:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agreement text',
    });
  }
};

const acceptAgreement = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (userRole !== 'vendor') {
      return res.status(403).json({
        success: false,
        error: 'Only vendors can accept agreements',
      });
    }

    const agreement = await vendorAgreementService.acceptAgreement(userId);

    res.status(200).json({
      success: true,
      message: 'Agreement accepted successfully',
      data: agreement,
    });
  } catch (error) {
    console.error('Error in acceptAgreement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept agreement',
    });
  }
};

const rejectAgreement = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (userRole !== 'vendor') {
      return res.status(403).json({
        success: false,
        error: 'Only vendors can reject agreements',
      });
    }

    const agreement = await vendorAgreementService.rejectAgreement(userId);

    res.status(200).json({
      success: true,
      message: 'Agreement rejected',
      data: agreement,
    });
  } catch (error) {
    console.error('Error in rejectAgreement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject agreement',
    });
  }
};

const getOutstandingCommission = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const amount = await vendorAgreementService.getOutstandingCommission(userId);

    res.status(200).json({
      success: true,
      data: {
        outstandingCommission: amount,
      },
    });
  } catch (error) {
    console.error('Error in getOutstandingCommission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch outstanding commission',
    });
  }
};

module.exports = {
  getAgreement,
  getAgreementText,
  acceptAgreement,
  rejectAgreement,
  getOutstandingCommission,
};
