// Regenerates plugin/skills/ from Vexur's live Claude playbooks, the same rows Claude reads through
// the connector's get_skill tool. Runs on a schedule in GitHub Actions, and by hand with
// `node scripts/sync-skills.mjs`. Bumps the plugin's patch version only when a playbook changed,
// so Claude sees an update exactly when there is one.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN_DIR = join(ROOT, "plugin");
const SKILLS_DIR = join(PLUGIN_DIR, "skills");
const PLUGIN_JSON = join(PLUGIN_DIR, ".claude-plugin", "plugin.json");
const LOCK_JSON = join(PLUGIN_DIR, "skills.lock.json");

// Public by design: Supabase publishable key, and the database only returns status = 'live' rows.
const SUPABASE_URL = "https://pgsnbsjtpxfmzedjldyu.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_orOZ17q36QQrjI3o9sE3Iw_CJHNe95O";

/** Skill names shown in Claude. The key stays what get_skill takes. */
const DISPLAY_NAMES = { crm: "contacts-and-deals" };

const FRONTMATTER = /^﻿?---\n([\s\S]*?)\n---\n*/;

function skillName(key) {
  return (DISPLAY_NAMES[key] ?? key).toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 64);
}

function yamlQuote(value) {
  return `"${value.replace(/\s+/g, " ").trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"').slice(0, 1024)}"`;
}

/** A playbook's own frontmatter description, when it has one, is written for skill triggering. */
function ownDescription(markdown) {
  const line = markdown.match(FRONTMATTER)?.[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  return line ? line.replace(/^["']|["']$/g, "") : null;
}

function skillMarkdown(row) {
  const content = (row.content_md ?? "").replace(/\r\n/g, "\n");
  const description = ownDescription(content) || row.summary || row.title || row.skill_key;
  // Some playbooks carry their own frontmatter; the plugin writes one block, not two.
  const body = content.replace(FRONTMATTER, "").trim();
  return [
    "---",
    `name: ${skillName(row.skill_key)}`,
    `description: ${yamlQuote(description)}`,
    "---",
    "",
    `> Vexur's \`${row.skill_key}\` playbook, version ${row.version ?? 1}. With the Vexur connector connected, call \`get_skill\` with key \`${row.skill_key}\` first and follow that live version wherever the two differ.`,
    "",
    body,
    "",
  ].join("\n");
}

function bumpPatch(version) {
  const [major = 1, minor = 0, patch = 0] = String(version).split(".").map((part) => Number.parseInt(part, 10) || 0);
  return `${major}.${minor}.${patch + 1}`;
}

const response = await fetch(
  `${SUPABASE_URL}/rest/v1/mcp_skills?select=skill_key,title,summary,content_md,version&status=eq.live&order=sort_order.asc,skill_key.asc`,
  { headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${PUBLISHABLE_KEY}` } },
);
if (!response.ok) throw new Error(`Could not read the live playbooks: HTTP ${response.status} ${await response.text()}`);
const rows = await response.json();
// An empty or broken read must never wipe the published skills.
if (!Array.isArray(rows) || rows.length === 0) throw new Error("No live playbooks came back; leaving the plugin unchanged.");

const files = new Map(rows.map((row) => [skillName(row.skill_key), skillMarkdown(row)]));
const hash = createHash("sha256");
for (const [name, markdown] of [...files].sort(([a], [b]) => a.localeCompare(b))) hash.update(`${name}\n${markdown}\n`);
const contentHash = hash.digest("hex");

let previous = null;
try {
  previous = JSON.parse(readFileSync(LOCK_JSON, "utf8"));
} catch {
  previous = null;
}

rmSync(SKILLS_DIR, { recursive: true, force: true });
for (const [name, markdown] of files) {
  mkdirSync(join(SKILLS_DIR, name), { recursive: true });
  writeFileSync(join(SKILLS_DIR, name, "SKILL.md"), markdown);
}

const plugin = JSON.parse(readFileSync(PLUGIN_JSON, "utf8"));
if (previous && previous.content_hash !== contentHash) plugin.version = bumpPatch(plugin.version);
writeFileSync(PLUGIN_JSON, `${JSON.stringify(plugin, null, 2)}\n`);
writeFileSync(
  LOCK_JSON,
  `${JSON.stringify(
    {
      content_hash: contentHash,
      plugin_version: plugin.version,
      skills: rows.map((row) => ({ name: skillName(row.skill_key), key: row.skill_key, version: row.version ?? 1 })),
    },
    null,
    2,
  )}\n`,
);

const names = readdirSync(SKILLS_DIR).sort();
console.log(`${names.length} skills, plugin ${plugin.version}${previous?.content_hash === contentHash ? " (unchanged)" : ""}: ${names.join(", ")}`);
