const getCanonicalChatId = (firstUserId, secondUserId) => {
  const first = String(firstUserId || '').trim();
  const second = String(secondUserId || '').trim();

  if (!first || !second) {
    return '';
  }

  return first.localeCompare(second) <= 0 ? `chat_${first}_${second}` : `chat_${second}_${first}`;
};

const getChatIdVariants = (chatId) => {
  const roomId = String(chatId || '').trim();

  if (!roomId) {
    return [];
  }

  const variants = new Set([roomId]);

  if (roomId.startsWith('chat_')) {
    const segments = roomId.split('_');

    if (segments.length === 3) {
      const [, firstUserId, secondUserId] = segments;
      const canonicalChatId = getCanonicalChatId(firstUserId, secondUserId);
      variants.add(canonicalChatId);
      // Also add the reversed version to ensure all combinations of user IDs are covered
      variants.add(`chat_${secondUserId}_${firstUserId}`);
    }
  } else {
    variants.add(`chat_${roomId}`);
  }

  return [...variants].filter(Boolean);
};

module.exports = {
  getCanonicalChatId,
  getChatIdVariants,
};
