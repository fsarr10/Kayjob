const PHONE_PATTERNS = [
  /(?:\+221|00221|221)?\s?(?:7\d{2}|3[03]\d)\s?\d{3}\s?\d{2}\s?\d{2}/gi,
  /\b(?:whatsapp|whats app|wave|orange\s*money|om|yas|expresso|appelle[- ]?moi|contacte[- ]?moi)\b/gi,
  /https?:\/\/[^\s]+/gi
];

export function redactContactContent(body) {
  let redacted = body;
  const matches = [];
  for (const pattern of PHONE_PATTERNS) {
    redacted = redacted.replace(pattern, (match) => {
      matches.push(match);
      return "••••••";
    });
  }
  return {
    body: redacted,
    flagged: matches.length > 0,
    signalCount: matches.length,
    reason: matches.length ? "contact_or_external_link_detected" : null
  };
}
