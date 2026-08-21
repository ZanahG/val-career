const teamLogos = import.meta.glob("../images/teams/**/*.{png,jpg,jpeg,webp,svg}", {eager: true, import: "default"}) as Record<string,string>;

export function getTeamLogo(logo?: string) {
  if (!logo) return undefined;

  const key = `../images/teams/${logo}`;
  return teamLogos[key];
}