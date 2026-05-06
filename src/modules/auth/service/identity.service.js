const User = require('../model/user.model');

/**
 * Perform automated AI verification of the identity
 * Compares the selfie with the ID document and extracts data
 */
const verifyIdentityWithAI = async (userId, idFrontUrl, selfieUrl) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.log('AI Verification skipped: GEMINI_API_KEY not configured');
    return null;
  }

  try {
    console.log(`Starting AI Verification for user: ${userId}`);
    
    // Helper to fetch image and convert to base64
    const getImageBase64 = async (url) => {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString('base64');
    };

    const [idBase64, selfieBase64] = await Promise.all([
      getImageBase64(idFrontUrl),
      getImageBase64(selfieUrl)
    ]);

    const prompt = `
      You are an automated KYC (Know Your Customer) identity verification system.
      Analyze these two images:
      1. An identity document (CNIC).
      2. A live selfie of the person.

      Tasks:
      - Determine if the person in the selfie matches the face on the identity document.
      - Extract the CNIC number and Full Name from the identity document.
      - Check if the document looks authentic and not a screen capture or printout.

      Return ONLY a JSON object with this structure:
      {
        "isMatch": boolean,
        "confidence": number (0-100),
        "cnicNumber": "extracted number",
        "fullName": "extracted name",
        "reason": "short explanation of the result"
      }
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: idBase64 } },
            { inline_data: { mime_type: "image/jpeg", data: selfieBase64 } }
          ]
        }]
      })
    });

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResult) throw new Error('AI failed to return a result');

    // Extract JSON from the markdown block if present
    const jsonStr = textResult.replace(/```json|```/g, '').trim();
    const result = JSON.parse(jsonStr);

    console.log(`AI Verification Result for ${userId}:`, result);
    return result;
  } catch (error) {
    console.error('AI Verification Error:', error);
    return null;
  }
};

const submitKyc = async (userId, kycData) => {
  const { cnic, idFrontImage, idBackImage, selfieImage, livenessConfidence } = kycData;
  
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  user.identityDetails = {
    cnic,
    idFrontImage,
    idBackImage,
    selfieImage,
    livenessConfidence: livenessConfidence || 0,
    submissionDate: new Date(),
  };
  
  user.verificationStatus = 'pending';
  await user.save();

  // If no ID image is provided, rely purely on liveness confidence
  if (!idFrontImage) {
      console.log(`No ID provided. Checking livenessConfidence for fallback: ${livenessConfidence}`);
      if (livenessConfidence >= 0.7) {
        user.verificationStatus = 'verified';
        user.identityDetails.verifiedAt = new Date();
        user.identityDetails.aiReason = 'Auto-verified via Liveness Fallback (No CNIC Provided)';
        console.log(`Auto-verified user ${userId} via Liveness Fallback`);
      } else {
        user.verificationStatus = 'rejected';
        user.identityDetails.rejectionReason = 'Facial liveness verification failed';
      }
      await user.save();
      return { 
        success: true, 
        message: 'KYC processed using facial liveness',
        status: user.verificationStatus
      };
  }

  // Trigger AI Verification in the background if ID is provided
  verifyIdentityWithAI(userId, idFrontImage, selfieImage).then(async (aiResult) => {
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) return;

    if (aiResult) {
      // Logic for Real AI result
      if (aiResult.isMatch && aiResult.confidence > 80) {
        userToUpdate.verificationStatus = 'verified';
        userToUpdate.identityDetails.verifiedAt = new Date();
        userToUpdate.identityDetails.aiConfidence = aiResult.confidence;
        userToUpdate.identityDetails.aiReason = aiResult.reason;
        console.log(`Auto-verified user ${userId} via AI`);
      } else if (aiResult.isMatch === false || aiResult.confidence < 40) {
        userToUpdate.verificationStatus = 'rejected';
        userToUpdate.identityDetails.rejectionReason = `AI verification failed: ${aiResult.reason}`;
        console.log(`Auto-rejected user ${userId} via AI`);
      }
    } else {
      // FALLBACK FOR TESTING (If Gemini Key is missing)
      console.log(`AI Key missing. Checking livenessConfidence for fallback: ${livenessConfidence}`);
      if (livenessConfidence >= 0.7) {
        userToUpdate.verificationStatus = 'verified';
        userToUpdate.identityDetails.verifiedAt = new Date();
        userToUpdate.identityDetails.aiReason = 'Auto-verified via Liveness Fallback (No AI Key)';
        console.log(`Auto-verified user ${userId} via Liveness Fallback`);
      }
    }
    
    await userToUpdate.save();
  });

  return { 
    success: true, 
    message: 'KYC submitted successfully and is being processed by AI',
    status: 'pending'
  };
};

const getKycStatus = async (userId) => {
  const user = await User.findById(userId).select('verificationStatus identityDetails');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    status: user.verificationStatus,
    rejectionReason: user.identityDetails?.rejectionReason,
    submissionDate: user.identityDetails?.submissionDate,
    verifiedAt: user.identityDetails?.verifiedAt,
    aiReason: user.identityDetails?.aiReason
  };
};

// Admin only: Approve/Reject KYC
const updateKycStatus = async (userId, status, rejectionReason = '') => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (!['verified', 'rejected'].includes(status)) {
    const error = new Error('Invalid status. Use verified or rejected');
    error.statusCode = 400;
    throw error;
  }

  user.verificationStatus = status;
  if (status === 'verified') {
    user.identityDetails.verifiedAt = new Date();
    user.identityDetails.rejectionReason = undefined;
  } else {
    user.identityDetails.rejectionReason = rejectionReason;
  }

  await user.save();
  return { success: true, message: `KYC status updated to ${status}`, user: { id: user._id, status: user.verificationStatus } };
};

module.exports = {
  submitKyc,
  getKycStatus,
  updateKycStatus,
};

