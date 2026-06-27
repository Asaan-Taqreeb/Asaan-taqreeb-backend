const fs = require('fs');
const path = require('path');
const { sendSuccess } = require('../../../shared/utils/response.util');

const updateInfoFilePath = path.join(__dirname, '..', '..', '..', '..', 'app-update.json');

const readLocalUpdateInfo = () => {
  try {
    if (!fs.existsSync(updateInfoFilePath)) {
      return null;
    }

    const raw = fs.readFileSync(updateInfoFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to read app-update.json:', error.message);
    return null;
  }
};

const getUpdateInfo = async (req, res) => {
  const localUpdateInfo = readLocalUpdateInfo();
  const latestVersion = localUpdateInfo?.latestVersion || process.env.APP_LATEST_VERSION || '1.2.0';
  const apkUrl = localUpdateInfo?.apkUrl || process.env.APP_APK_URL || '';
  const forceUpdate = Boolean(
    localUpdateInfo?.forceUpdate ?? (process.env.APP_FORCE_UPDATE === 'true')
  );
  const releaseNotes = localUpdateInfo?.releaseNotes || process.env.APP_RELEASE_NOTES || '';

  return sendSuccess(res, 200, 'Update info fetched successfully', {
    latestVersion,
    apkUrl,
    forceUpdate,
    releaseNotes: releaseNotes || undefined,
  });
};

module.exports = {
  getUpdateInfo,
};
