import { describe, expect, it } from "vitest";

import { getLocaleDefaults } from "./getLocaleDefaults";

describe("getLocaleDefaults", () => {
  describe("timeFormat", () => {
    it("should return 12-hour format for US English", () => {
      const result = getLocaleDefaults("en-US");
      expect(result.timeFormat).toBe(12);
    });

    it("should return 24-hour format for German", () => {
      const result = getLocaleDefaults("de");
      expect(result.timeFormat).toBe(24);
    });

    it("should return 24-hour format for French", () => {
      const result = getLocaleDefaults("fr");
      expect(result.timeFormat).toBe(24);
    });

    it("should return 12-hour format for Arabic", () => {
      // Arabic countries typically use 12-hour format
      const result = getLocaleDefaults("ar");
      expect(result.timeFormat).toBe(12);
    });
  });

  describe("weekStart", () => {
    it("should return Sunday for US English", () => {
      const result = getLocaleDefaults("en-US");
      expect(result.weekStart).toBe("Sunday");
    });

    it("should return Monday for German", () => {
      const result = getLocaleDefaults("de");
      expect(result.weekStart).toBe("Monday");
    });

    it("should return Monday for French", () => {
      const result = getLocaleDefaults("fr");
      expect(result.weekStart).toBe("Monday");
    });

    it("should return Saturday for Arabic", () => {
      const result = getLocaleDefaults("ar");
      expect(result.weekStart).toBe("Saturday");
    });

    it("should return Monday for British English", () => {
      const result = getLocaleDefaults("en-GB");
      expect(result.weekStart).toBe("Monday");
    });

    it("should return Sunday for Japanese", () => {
      const result = getLocaleDefaults("ja");
      expect(result.weekStart).toBe("Sunday");
    });

    it("should return Sunday for Hebrew", () => {
      const result = getLocaleDefaults("he");
      expect(result.weekStart).toBe("Sunday");
    });
  });

  describe("unknown locales", () => {
    it("should return sensible defaults for unknown locales", () => {
      const result = getLocaleDefaults("xyz-unknown");
      expect(result.timeFormat).toBe(12);
      expect(result.weekStart).toBe("Sunday");
    });
  });
});
