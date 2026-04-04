import useDatabase from "../useDatabase";

// Mock expo-sqlite
const mockGetFirstAsync = jest.fn();
const mockGetAllAsync = jest.fn();
const mockDb = {
  getFirstAsync: mockGetFirstAsync,
  getAllAsync: mockGetAllAsync,
} as any;

// Mock fuse.js
jest.mock("fuse.js", () => {
  return jest.fn().mockImplementation(() => {
    return {
      search: jest.fn().mockReturnValue([
        { item: { cardId: "1", name: "Mocked Match 1" } },
        { item: { cardId: "2", name: "Mocked Match 2" } },
      ]),
    };
  });
});

describe("useDatabase", () => {
  let hook: ReturnType<typeof useDatabase>;

  beforeEach(() => {
    jest.clearAllMocks();
    hook = useDatabase(mockDb);
  });

  describe("findCardByName", () => {
    it("should find card by exact name", async () => {
      mockGetFirstAsync.mockResolvedValueOnce({
        cardId: "1",
        name: "Dark Magician",
      });

      const result = await hook.findCardByName("Dark Magician");

      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining("UPPER(name) = ?"),
        ["DARK MAGICIAN"],
      );
      expect(result.name).toBe("Dark Magician");
    });
  });

  describe("searchCards", () => {
    it("should return empty array if card name is too short", async () => {
      const result = await hook.searchCards("AB");
      expect(result).toEqual([]);
    });

    it("should return multiple ranked matches", async () => {
      mockGetAllAsync.mockResolvedValueOnce([
        { cardId: "1", name: "Card A" },
        { cardId: "2", name: "Card B" },
      ]);

      const result = await hook.searchCards("Searching");
      
      expect(result.length).toBe(2);
      expect(result[0].name).toBe("Mocked Match 1");
    });

    it("should return empty array if no candidates found in DB", async () => {
      mockGetAllAsync.mockResolvedValueOnce([]);
      const result = await hook.searchCards("Unknown");
      expect(result).toEqual([]);
    });
  });

  describe("findCardByNames", () => {
    it("should handle an array of candidate names using multi-word fallback", async () => {
      mockGetAllAsync.mockResolvedValueOnce([
        { cardId: "2", name: "Yummy☆Surprise" },
      ]);

      const candidates = ["YUMMY SURPRISE"];
      const result = await hook.findCardByNames(candidates);

      expect(result.name).toBe("Mocked Match 1"); // ranking logic uses fuse mock
    });
  });
});
