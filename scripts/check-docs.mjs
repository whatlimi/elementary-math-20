#!/usr/bin/env node
// Lightweight documentation check. Zero dependencies — Node standard library only.
//
// Usage: node scripts/check-docs.mjs [docs-root]
//
// Errors  -> broken relative links, missing required files        (exit 1)
// Warnings -> over-long documents, design docs missing key sections,
//             requirement documents without a matching design doc  (exit 0)

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative, basename } from "node:path";

const DOCS_ROOT = resolve(process.argv[2] ?? "docs");
const SIZE_SOFT_LINE = 300;

const errors = [];
const warnings = [];

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "_archive" || entry.name === "node_modules") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

// Placeholder files carry unfilled paths on purpose — skip their link checks.
const isTemplate = (file) => basename(file).toUpperCase().includes("TEMPLATE");

if (!existsSync(DOCS_ROOT)) {
  console.error(`check-docs: docs root not found: ${DOCS_ROOT}`);
  process.exit(1);
}

const files = walk(DOCS_ROOT);
if (files.length === 0) {
  console.error(`check-docs: no markdown files under ${DOCS_ROOT}`);
  process.exit(1);
}

// --- required files -------------------------------------------------------

for (const name of ["TODO.md"]) {
  if (!existsSync(join(DOCS_ROOT, name))) {
    errors.push(`missing required file: ${basename(DOCS_ROOT)}/${name}`);
  }
}

// --- per-file checks ------------------------------------------------------

const LINK_RE = /\[[^\]]*\]\(([^)]+)\)/g;
const REQUIRED_DESIGN_SECTIONS = ["Goal", "Approach", "Affected files", "Acceptance"];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const rel = relative(DOCS_ROOT, file).replace(/\\/g, "/");
  const lines = text.split("\n").length;

  if (lines > SIZE_SOFT_LINE) {
    warnings.push(`${rel}: ${lines} lines (soft limit ${SIZE_SOFT_LINE}) — consider splitting`);
  }

  if (!isTemplate(file)) {
    for (const match of text.matchAll(LINK_RE)) {
      const target = match[1].trim();
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const pathPart = target.split("#")[0];
      if (!pathPart) continue;
      if (!existsSync(resolve(dirname(file), pathPart))) {
        errors.push(`${rel}: broken link -> ${target}`);
      }
    }
  }

  if (rel.startsWith("design/") && !isTemplate(file)) {
    for (const section of REQUIRED_DESIGN_SECTIONS) {
      const re = new RegExp(`^#+\\s*\\d*\\.?\\s*${section}\\b`, "im");
      if (!re.test(text)) {
        warnings.push(`${rel}: missing section "${section}"`);
      }
    }
  }
}

// --- requirement <-> design pairing ---------------------------------------

const reqDir = join(DOCS_ROOT, "requirements");
const desDir = join(DOCS_ROOT, "design");
if (existsSync(reqDir) && existsSync(desDir)) {
  for (const name of readdirSync(reqDir)) {
    if (!name.endsWith(".md") || isTemplate(name)) continue;
    if (!existsSync(join(desDir, name))) {
      warnings.push(`requirements/${name}: no matching design/${name}`);
    }
  }
}

// --- report ---------------------------------------------------------------

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
console.log(
  `check-docs: ${files.length} files, ${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exit(errors.length > 0 ? 1 : 0);