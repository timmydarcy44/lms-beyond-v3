/** Clé de Luhn sur les 14 chiffres d'un SIRET. */
export function isValidSiret(value: string) {
  if (!/^\d{14}$/.test(value)) return false;
  let sum = 0;
  for (let index = 0; index < 14; index += 1) {
    let digit = Number(value[13 - index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export function cleanSiret(value: unknown) {
  return String(value ?? "").replace(/\s/g, "");
}
