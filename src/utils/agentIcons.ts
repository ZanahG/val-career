const agentIconModules = import.meta.glob("../images/agents/*.{png,jpg,jpeg,webp,svg}", {eager: true, import: "default"}) as Record<string,string>;

const normalizeAgentName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g,"");

export function getAgentIcon(agent?: string) {
  if (!agent) return undefined;

  const target = normalizeAgentName(agent);

  for (const [path,src] of Object.entries(agentIconModules)) {
    const fileName = path.split("/").pop()?.split(".")[0] ?? "";
    if (normalizeAgentName(fileName) === target) return src;
  }

  return undefined;
}