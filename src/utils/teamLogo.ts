export function getTeamLogo(logo?: string) {
  if (!logo) return undefined;

  return `/images/teams/${logo}`;
}