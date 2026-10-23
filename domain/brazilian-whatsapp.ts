export const BRAZILIAN_WHATSAPP_EXAMPLE = "+55 (11) 99999-9999";
export const BRAZILIAN_WHATSAPP_INPUT_PATTERN = "[+]55 [(][1-9][0-9][)] 9[0-9]{4}-[0-9]{4}";

const BRAZILIAN_MOBILE_PATTERN = /^\+55[1-9]\d9\d{8}$/;

export function normalizeBrazilianWhatsapp(value: string): string {
  const digits = value.replace(/\D/g, "");
  const internationalDigits = digits.length === 11 ? `55${digits}` : digits;
  return internationalDigits ? `+${internationalDigits}` : "";
}

export function isBrazilianMobileWhatsapp(value: string): boolean {
  return BRAZILIAN_MOBILE_PATTERN.test(value);
}

export function formatBrazilianWhatsapp(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("55")) digits = digits.slice(2);
  digits = digits.slice(0, 11);

  const areaCode = digits.slice(0, 2);
  const firstBlock = digits.slice(2, 7);
  const secondBlock = digits.slice(7, 11);
  let formatted = "+55";
  if (areaCode) formatted += ` (${areaCode}`;
  if (areaCode.length === 2) formatted += ")";
  if (firstBlock) formatted += ` ${firstBlock}`;
  if (secondBlock) formatted += `-${secondBlock}`;
  return formatted;
}
