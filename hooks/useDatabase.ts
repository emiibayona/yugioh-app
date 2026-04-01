import { SQLiteDatabase, useSQLiteContext } from "expo-sqlite";
import Fuse from "fuse.js";

export default function useDatabase(db: SQLiteDatabase) {
  function findTopMatch(
    input: string,
    candidates: object[],
  ): { cardId: string } | null {
    const options = {
      // The keys in your database objects to search against
      keys: ["name"],
      // 0.0 = perfect match, 1.0 = total mismatch.
      // 0.35 is usually the "sweet spot" for OCR typos.
      threshold: 0.35,
      // Helps find matches even if the OCR missed the start of the name
      location: 0,
      distance: 100,
      includeScore: true,
    };

    const fuse = new Fuse(candidates, options);
    const results = fuse.search(input);

    // Return the top result if it exists, otherwise null
    return results.length > 0 ? (results[0].item as { cardId: string }) : null;
  }

  async function addCardToScannedCollection(cardId: string) {
    if (!cardId) {
      return null;
    }
    console.log("Card added to scanned collection:", cardId);
  }

  async function findImageByCardId(cardId: string) {
    if (!cardId) {
      return null;
    }
    const image: { card: string } | null = await db.getFirstAsync(
      "select * from cardPoolImages as cpi where cpi.cardId = ?",
      [cardId],
    );
    return image;
  }

  async function findCardByName(cardName: string, withImage: boolean = false) {
    if (!cardName) {
      return null;
    }
    const cardFound: { cardId: string } | null = await db.getFirstAsync(
      "select * from cardPoolNames as cpn where UPPER(cpn.name) = ?",
      [cardName.toUpperCase()],
    );

    if (cardFound && withImage) {
      const image = await findImageByCardId(cardFound.cardId);
      return { ...cardFound, ...image };
    }
    return cardFound;
  }

  async function getCardsByName(cardName: string, withImage: boolean = false) {
    if (!cardName) {
      return null;
    }
    const normalized = normalizeSearchString(cardName);
    const cardsFound: { cardId: string }[] = await db.getAllAsync(
      "select * from cardPoolNames as cpn where UPPER(cpn.name) = ?",
      [normalized.toUpperCase()],
    );

    if (cardsFound?.length === 0) {
      const res = findTopMatch(normalized, cardsFound);
      if (res) {
        if (withImage) {
          const image = await findImageByCardId(res.cardId);
          return { ...res, ...image };
        }
      }
      return res;
    }
  }

  function normalizeSearchString(str: string) {
    return (
      str
        .toLowerCase()
        // Remove specific characters: |, _, -, [, ], (, )
        // We also escape characters that have special meaning in Regex
        .replace(/[|_\-\[\]\(\)]/g, " ")
        // Remove any non-alphanumeric characters except spaces
        .replace(/[^a-z0-9\s]/g, "")
        // Collapse multiple spaces into one and trim
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  return {
    normalizeSearchString: normalizeSearchString,
    findImageByCardId: findImageByCardId,
    findCardByName: findCardByName,
    addCardToScannedCollection: addCardToScannedCollection,
  };
}
