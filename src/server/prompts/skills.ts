import fs from "fs";
import path from "path";

/**
 * Loads design "skills" (SKILL.md files under `PPT Skills/`) and exposes them
 * as reusable design guidance that can be injected into generation prompts.
 *
 * A skill file is markdown with optional YAML frontmatter (name, description).
 * The body is the design specification (tokens, layout patterns, do/don't).
 */

export type DesignSkill = {
  id: string;
  name: string;
  description: string;
  /** Full markdown body (frontmatter stripped). */
  body: string;
};

const SKILLS_DIR = path.join(process.cwd(), "PPT Skills");
const MAX_GUIDANCE_CHARS = 3500;

let cache: DesignSkill[] | null = null;

function parseFrontmatter(raw: string): {
  data: Record<string, string>;
  body: string;
} {
  if (!raw.startsWith("---")) return { data: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: raw };
  const fm = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).trim();
  const data: Record<string, string> = {};
  for (const line of fm.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) {
      let val = m[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      data[m[1]] = val;
    }
  }
  return { data, body };
}

/** Lists all available design skills (cached). */
export function listSkills(): DesignSkill[] {
  if (cache) return cache;
  const skills: DesignSkill[] = [];
  try {
    const files = fs.readdirSync(SKILLS_DIR);
    for (const file of files) {
      if (!file.endsWith(".SKILL.md")) continue;
      const raw = fs.readFileSync(path.join(SKILLS_DIR, file), "utf8");
      const { data, body } = parseFrontmatter(raw);
      const id = data.name || file.replace(/\.SKILL\.md$/, "");
      skills.push({
        id,
        name: data.name || id,
        description: data.description || "",
        body,
      });
    }
  } catch {
    // Directory missing or unreadable — no skills available.
  }
  cache = skills;
  return skills;
}

/** Returns a skill by id, or the first available skill, or null. */
export function getSkill(id?: string | null): DesignSkill | null {
  const skills = listSkills();
  if (skills.length === 0) return null;
  if (id) {
    const found = skills.find((s) => s.id === id);
    if (found) return found;
  }
  return skills[0];
}

/**
 * Returns a prompt-ready design guidance block for the given skill id, capped
 * to a reasonable size so it does not dominate the context budget.
 */
export function getSkillGuidance(id?: string | null): string {
  const skill = getSkill(id);
  if (!skill) return "";
  const body =
    skill.body.length > MAX_GUIDANCE_CHARS
      ? skill.body.slice(0, MAX_GUIDANCE_CHARS) + "\n...(truncated)"
      : skill.body;
  return `## DESIGN SKILL: ${skill.name}\nApply this visual/design system when choosing layouts, tone, and structure:\n\n${body}`;
}
