import { useCallback } from "react";

/**
 * Hook to construct the proxy image URL for cards.
 * URL format: {{url}}/files/cards/{{cardName}}?url={{originalImageUrl}}
 */
export default function useCardImage() {
  // Using EXPO_PUBLIC prefix for automatic loading from .env in Expo projects
  const baseUrl = process?.env?.EXPO_PUBLIC_API_URL;

  const getCardImageUrl = useCallback(
    (cardName: string, cardId: string, item: any = null) => {
      if (!cardName || !cardId) return "";

      if (item?.localUrl) return item.localUrl; // Return local URL if it exists
      // Original image URL from ygoprodeck
      const originalImageUrl = `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`;

      // Encode components for safety
      const encodedName = encodeURIComponent(cardName);
      const encodedOriginalUrl = encodeURIComponent(originalImageUrl);

      // console.log(
      //   "🚀 ~ getCardImageUrl ~ baseUrl:",
      //   `${baseUrl}/files/cards/${encodedName}?url=${encodedOriginalUrl}`,
      // );
      // Add logic to download and save the image locally if needed, then return the local URI instead of the proxy URL
      return `${baseUrl}/files/cards/${encodedName}?url=${encodedOriginalUrl}`;
    },
    [baseUrl],
  );

  return { getCardImageUrl };
}
