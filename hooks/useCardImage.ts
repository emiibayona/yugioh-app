import * as FileSystem from "expo-file-system";
import Config from "@/constants/Config";
import { useCallback, useState, useEffect } from "react";

// Permanent directory for card images
const CARD_CACHE_DIR = `${FileSystem.documentDirectory}ImagesCards/`;

export default function useCardImage() {
  // Ensure the directory exists on mount
  useEffect(() => {
    const ensureDir = async () => {
      const dirInfo = await FileSystem.getInfoAsync(CARD_CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CARD_CACHE_DIR, {
          intermediates: true,
        });
      }
    };
    ensureDir();
  }, []);

  const getLocalPath = (cardId: string) => `${CARD_CACHE_DIR}${cardId}.jpg`;

  const getCardImageUrl = useCallback(
    async (cardName: string, cardId: string, item: any = null) => {
      if (!cardName || !cardId) return "";

      // 1. Check if we already have it locally
      const localUri = getLocalPath(cardId);
      const fileInfo = await FileSystem.getInfoAsync(localUri);

      if (fileInfo.exists) {
        return localUri;
      }

      if (item?.localUrl) return item.localUrl; // Return local URL if it exists

      // 2. If not local, prepare the Remote/Proxy URL
      const originalImageUrl = `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`;
      const encodedName = encodeURIComponent(cardName);
      const encodedOriginalUrl = encodeURIComponent(originalImageUrl);
      const remoteUrl = `${Config.API_URL}/files/cards/${encodedName}?url=${encodedOriginalUrl}`;

      // 3. Download it in the background for future use
      // We don't "await" this so the UI can show the remote image immediately
      FileSystem.downloadAsync(remoteUrl, localUri)
        .then(({ uri }) => console.log(`💾 Saved ${cardName} to ${uri}`))
        .catch((err) => console.error("❌ Download failed", err));

      return remoteUrl;
    },
    [Config.API_URL],
  );

  return { getCardImageUrl };
}
