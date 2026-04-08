import { SQLiteDatabase, useSQLiteContext } from "expo-sqlite";
import Fuse from "fuse.js";

export default function useDatabase(db: SQLiteDatabase) {
  function findTopMatch(
    input: string,
    candidates: { cardId: string; name: string }[],
  ): { cardId: string; name: string } | null {
    // 1. Helper to strip everything except letters, numbers, and spaces
    const clean = (str: string) =>
      str
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .trim();

    const options = {
      keys: ["searchName"], // We will search against a "cleaned" key
      threshold: 0.4, // ⚠️ Loosen this to 0.5 for OCR errors
      location: 0,
      distance: 100,
      includeScore: true,
    };

    // 2. Prepare candidates by adding a 'searchName' field
    const preparedCandidates = candidates.map((x) => ({
      ...x,
      searchName: clean(x.name || ""),
    }));

    const fuse = new Fuse(preparedCandidates, options);
    // 3. Clean the input too
    const results = fuse.search(clean(input));

    return results.length > 0 ? results[0].item : null;
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
      "select * from cards as cpi where cpi.id = ?",
      [cardId],
    );
    return image;
  }

  async function findCardByName(cardName: string, withImage: boolean = false) {
    if (!db) throw new Error("Database not available in useDatabase hook");
    if (!cardName || cardName.length < 3) {
      return null;
    }
    const normalized = cardName.trim().toUpperCase();

    try {
      // 1. Exact or simple LIKE match first (fast)
      let cardFound: any = await db.getFirstAsync(
        "SELECT * FROM cards WHERE UPPER(name) = ? LIMIT 1",
        [normalized],
      );

      // 2. If not found, try a LIKE with wildcards
      if (!cardFound) {
        cardFound = await db.getFirstAsync(
          "SELECT * FROM cards WHERE UPPER(name) LIKE ? LIMIT 1",
          [`%${normalized}%`],
        );
      }

      // 3. Fallback: Multi-word match (handles symbols like "Yummy☆Surprise" when OCR says "YUMMY SURPRISE")
      if (!cardFound) {
        const words = normalized.split(/\s+/).filter((w) => w.length >= 2);
        if (words.length >= 2) {
          const query = `SELECT * FROM cards WHERE ${words
            .map(() => "UPPER(name) LIKE ?")
            .join(" AND ")} LIMIT 20`;
          const params = words.map((w) => `%${w}%`);

          const results: any[] = await db.getAllAsync(query, params);

          if (results?.length > 0) {
            cardFound = findTopMatch(normalized, results);
          }
        }
      }

      // 4. Fallback: Fuzzy search with better candidate selection
      if (!cardFound && normalized.length > 4) {
        // Try to get candidates that contain the first part of the name
        const prefix = normalized.substring(0, 3);
        const candidates: any[] = await db.getAllAsync(
          "SELECT * FROM cards WHERE name LIKE ? LIMIT 100",
          [`%${prefix}%`],
        );

        if (candidates?.length > 0) {
          cardFound = findTopMatch(normalized, candidates);
        }
      }

      if (cardFound && withImage) {
        const image = await findImageByCardId(cardFound.cardId);
        return { ...cardFound, ...image };
      }
      return cardFound;
    } catch (error) {
      console.error("Database query error:", error);
      return null;
    }
  }

  async function findCardByEffect(
    effectText: string,
    withImage: boolean = false,
  ) {
    if (!db) throw new Error("Database not available in useDatabase hook");
    if (!effectText || effectText.length < 20) return null;

    const normalized = effectText.trim();

    try {
      // 100% exact match as requested
      const cardFound: any = await db.getFirstAsync(
        "SELECT * FROM cards WHERE desc like ? LIMIT 1",
        [`%${normalized}%`],
      );

      if (cardFound && withImage) {
        const image = await findImageByCardId(cardFound.cardId);
        return { ...cardFound, ...image };
      }
      return cardFound;
    } catch (error) {
      console.error("Database effect search error:", error);
      return null;
    }
  }

  async function findCardByNames(
    cardNames: string[] = [],
    descriptionCandidates: string[] = [],
    withImage: boolean = false,
  ) {
    if (!db) throw new Error("Database not available in useDatabase hook");

    // 1. Try by names first
    if (cardNames && cardNames.length > 0) {
      const filteredNames = cardNames
        .map((n) =>
          n.trim().toUpperCase().replaceAll("|", "").replaceAll("/", ""),
        )
        .filter((n) => n.length >= 3 && !n.includes("\\"));

      if (filteredNames.length > 0) {
        try {
          const placeholders = filteredNames.map(() => "?").join(",");
          let cardFound: any = await db.getFirstAsync(
            `SELECT * FROM cards WHERE UPPER(name) IN (${placeholders}) LIMIT 1`,
            filteredNames,
          );

          if (cardFound) {
            if (withImage) {
              const image = await findImageByCardId(cardFound.cardId);
              return { ...cardFound, ...image };
            }
            return cardFound;
          }

          // Fallback to existing fuzzy/LIKE search for top name candidates
          for (const name of filteredNames.slice(0, 10)) {
            const result = await findCardByName(name, withImage);
            if (result) return result;
          }
        } catch (error) {
          console.error("Database findCardByNames error:", error);
        }
      }
    }

    // 2. If no name found, try exact description match if available
    if (descriptionCandidates && descriptionCandidates.length > 0) {
      for (const desc of descriptionCandidates) {
        if (desc.length > 40) {
          const result = await findCardByEffect(desc, withImage);
          if (result) return result;
        }
      }
    }

    return null;
  }

  async function searchCards(cardName: string, withImage: boolean = false) {
    if (!db) throw new Error("Database not available in useDatabase hook");
    if (!cardName || cardName.length < 3) return [];

    const normalized = cardName.trim().toUpperCase();

    try {
      // 1. Get a broad set of candidates
      const query = `SELECT * FROM cards WHERE UPPER(name) LIKE ? OR UPPER(name) LIKE ? LIMIT 100`;
      const params = [`%${normalized}%`, `${normalized.substring(0, 3)}%`];
      const candidates: any[] = await db.getAllAsync(query, params);

      if (candidates.length === 0) return [];

      // 2. Use Fuse to rank them
      const clean = (str: string) =>
        str
          .toUpperCase()
          .replace(/[^A-Z0-9\s]/g, "")
          .trim();

      const preparedCandidates = candidates.map((x) => ({
        ...x,
        searchName: clean(x.name || ""),
      }));

      const fuse = new Fuse(preparedCandidates, {
        keys: ["searchName"],
        threshold: 0.5,
        includeScore: true,
      });

      const fuseResults = fuse.search(clean(normalized));

      // 3. Take top 4
      const topMatches = fuseResults
        .slice(0, 10)
        .map((r) => r.item)
        .filter(
          (item, index, arr) =>
            arr.findIndex((i) => i.cardId === item.cardId) === index,
        );

      if (withImage) {
        for (let i = 0; i < topMatches.length; i++) {
          const image = await findImageByCardId(topMatches[i].cardId);
          topMatches[i] = { ...topMatches[i], ...image };
        }
      }

      return topMatches;
    } catch (error) {
      console.error("Database manual search error:", error);
      return [];
    }
  }

  return {
    // normalizeSearchString: normalizeSearchString,
    findImageByCardId: findImageByCardId,
    findCardByName: findCardByName,
    findCardByNames: findCardByNames,
    findCardByEffect: findCardByEffect,
    searchCards: searchCards,
    addCardToScannedCollection: addCardToScannedCollection,
  };
}
