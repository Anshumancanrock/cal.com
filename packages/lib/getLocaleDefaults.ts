/**
 * Returns locale-specific defaults for time format and week start day.
 * Uses the Intl API to determine conventions for the given locale.
 */

type LocaleDefaults = {
  timeFormat: 12 | 24;
  weekStart: "Sunday" | "Monday" | "Saturday";
};

/**
 * Determines if a locale uses 24-hour time format by checking
 * if the formatted time contains AM/PM indicators.
 */
function getTimeFormatForLocale(locale: string): 12 | 24 {
  try {
    const formatted = new Intl.DateTimeFormat(locale, { hour: "numeric" }).format(new Date(2024, 0, 1, 13));
    // If the formatted string contains AM/PM indicators, it's 12-hour format
    return /am|pm/i.test(formatted) ? 12 : 24;
  } catch {
    return 12; // Default to 12-hour if locale is invalid
  }
}

/**
 * Gets the first day of the week for a locale.
 * Uses Intl.Locale.prototype.weekInfo if available (modern browsers),
 * otherwise falls back to a lookup table for common locales.
 */
function getWeekStartForLocale(locale: string): "Sunday" | "Monday" | "Saturday" {
  try {
    // Try using the modern Intl.Locale API with weekInfo
    // Note: weekInfo is available in modern browsers (Chrome 92+, Firefox 119+, Safari 17.4+)
    const localeObj = new Intl.Locale(locale) as Intl.Locale & {
      weekInfo?: { firstDay: number };
      getWeekInfo?: () => { firstDay: number };
    };

    let firstDay: number | undefined;

    // Some browsers use getWeekInfo() method, others have weekInfo property
    if (typeof localeObj.getWeekInfo === "function") {
      firstDay = localeObj.getWeekInfo().firstDay;
    } else if (localeObj.weekInfo) {
      firstDay = localeObj.weekInfo.firstDay;
    }

    if (firstDay !== undefined) {
      // Intl.Locale weekInfo uses 1=Monday, 7=Sunday, 6=Saturday
      if (firstDay === 7) return "Sunday";
      if (firstDay === 6) return "Saturday";
      if (firstDay === 1) return "Monday";
    }
  } catch {
    // Fall through to lookup table
  }

  // Fallback lookup table for common locales
  // Based on ISO standards and cultural conventions
  const weekStartByLocale: Record<string, "Sunday" | "Monday" | "Saturday"> = {
    // Sunday start (Americas, parts of Asia)
    en: "Sunday",
    "en-US": "Sunday",
    "en-CA": "Sunday",
    ja: "Sunday",
    ko: "Sunday",
    zh: "Sunday",
    "zh-CN": "Sunday",
    "zh-TW": "Sunday",
    pt: "Sunday",
    "pt-BR": "Sunday",
    he: "Sunday",
    // Saturday start (Middle East, parts of Africa)
    ar: "Saturday",
    "ar-SA": "Saturday",
    "ar-EG": "Saturday",
    "ar-AE": "Saturday",
    fa: "Saturday",
    // Monday start (most of Europe, parts of Asia, Africa, Oceania)
    de: "Monday",
    fr: "Monday",
    es: "Monday",
    it: "Monday",
    nl: "Monday",
    pl: "Monday",
    ru: "Monday",
    uk: "Monday",
    sv: "Monday",
    da: "Monday",
    fi: "Monday",
    nb: "Monday",
    tr: "Monday",
    cs: "Monday",
    ro: "Monday",
    hu: "Monday",
    el: "Monday",
    bg: "Monday",
    hr: "Monday",
    sk: "Monday",
    sl: "Monday",
    et: "Monday",
    lv: "Monday",
    lt: "Monday",
    vi: "Monday",
    th: "Monday",
    id: "Monday",
    "en-GB": "Monday",
    "en-AU": "Monday",
    "en-NZ": "Monday",
    "en-IE": "Monday",
    "pt-PT": "Monday",
    "es-ES": "Monday",
  };

  // Try exact match first
  if (weekStartByLocale[locale]) {
    return weekStartByLocale[locale];
  }

  // Try language code without region
  const languageCode = locale.split("-")[0];
  if (weekStartByLocale[languageCode]) {
    return weekStartByLocale[languageCode];
  }

  // Default to Sunday (most common in Cal.com's primary markets)
  return "Sunday";
}

/**
 * Returns locale-specific defaults for time format and week start day.
 * @param locale - The locale code (e.g., "en-US", "ar", "de")
 * @returns Object with timeFormat (12 or 24) and weekStart ("Sunday", "Monday", or "Saturday")
 */
export function getLocaleDefaults(locale: string): LocaleDefaults {
  return {
    timeFormat: getTimeFormatForLocale(locale),
    weekStart: getWeekStartForLocale(locale),
  };
}
