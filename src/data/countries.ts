export interface CountryOption {
  code: string;
  name: {es: string; en: string};
  flag: string;
}

export const COUNTRIES: CountryOption[] = [
  {code: "AR", name: {es: "Argentina", en: "Argentina"}, flag: "🇦🇷"},
  {code: "AU", name: {es: "Australia", en: "Australia"}, flag: "🇦🇺"},
  {code: "BR", name: {es: "Brasil", en: "Brazil"}, flag: "🇧🇷"},
  {code: "CA", name: {es: "Canadá", en: "Canada"}, flag: "🇨🇦"},
  {code: "CL", name: {es: "Chile", en: "Chile"}, flag: "🇨🇱"},
  {code: "CN", name: {es: "China", en: "China"}, flag: "🇨🇳"},
  {code: "CO", name: {es: "Colombia", en: "Colombia"}, flag: "🇨🇴"},
  {code: "CR", name: {es: "Costa Rica", en: "Costa Rica"}, flag: "🇨🇷"},
  {code: "DE", name: {es: "Alemania", en: "Germany"}, flag: "🇩🇪"},
  {code: "ES", name: {es: "España", en: "Spain"}, flag: "🇪🇸"},
  {code: "FR", name: {es: "Francia", en: "France"}, flag: "🇫🇷"},
  {code: "GB", name: {es: "Reino Unido", en: "United Kingdom"}, flag: "🇬🇧"},
  {code: "IN", name: {es: "India", en: "India"}, flag: "🇮🇳"},
  {code: "JP", name: {es: "Japón", en: "Japan"}, flag: "🇯🇵"},
  {code: "KR", name: {es: "Corea del Sur", en: "South Korea"}, flag: "🇰🇷"},
  {code: "MX", name: {es: "México", en: "Mexico"}, flag: "🇲🇽"},
  {code: "NZ", name: {es: "Nueva Zelanda", en: "New Zealand"}, flag: "🇳🇿"},
  {code: "PE", name: {es: "Perú", en: "Peru"}, flag: "🇵🇪"},
  {code: "PH", name: {es: "Filipinas", en: "Philippines"}, flag: "🇵🇭"},
  {code: "PL", name: {es: "Polonia", en: "Poland"}, flag: "🇵🇱"},
  {code: "PT", name: {es: "Portugal", en: "Portugal"}, flag: "🇵🇹"},
  {code: "RU", name: {es: "Rusia", en: "Russia"}, flag: "🇷🇺"},
  {code: "SA", name: {es: "Arabia Saudita", en: "Saudi Arabia"}, flag: "🇸🇦"},
  {code: "SG", name: {es: "Singapur", en: "Singapore"}, flag: "🇸🇬"},
  {code: "TH", name: {es: "Tailandia", en: "Thailand"}, flag: "🇹🇭"},
  {code: "TR", name: {es: "Turquía", en: "Turkey"}, flag: "🇹🇷"},
  {code: "US", name: {es: "Estados Unidos", en: "United States"}, flag: "🇺🇸"},
  {code: "UY", name: {es: "Uruguay", en: "Uruguay"}, flag: "🇺🇾"},
  {code: "VE", name: {es: "Venezuela", en: "Venezuela"}, flag: "🇻🇪"},
];