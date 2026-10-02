/** Display-only Russian typography. Never write the result back to lesson/state data. */
export function formatAvatarText(text: string): string {
  // Explicit word boundaries: JavaScript's \b does not recognize Cyrillic.
  const shortWords = /(?<![а-яёa-z0-9_‑-])(а|и|но|да|или|либо|в|во|на|к|ко|с|со|у|о|об|обо|от|ото|до|за|из|изо|по|под|подо|над|надо|при|про|для|без|безо)[ \t\u00a0]+(?=[«„“"'(]*[а-яёa-z0-9])/gi;
  const units = /(\d)[ \t\u00a0]+(?=(?:минут(?:а|ы|у|е|ой)?|секунд(?:а|ы|у|е|ой)?|час(?:а|ов)?|ход(?:а|ов)?|очк(?:о|а|ов)|балл(?:а|ов)?|пеш(?:ка|ки|ек|ку)|фигур(?:а|ы|у)?|раз(?:а)?|дн(?:я|ей)|день|лет|год(?:а|ов)?|мс|сек|мин|кг|см|мм|км|м|г|с)(?![а-яёa-z0-9_])|[%°])/gi;
  return text.replace(shortWords, '$1\u00a0').replace(units, '$1\u00a0');
}
