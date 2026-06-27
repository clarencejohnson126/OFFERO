import { modelFor } from '../ai/model-policy';
import type { TaskKind } from '../ai/tasks';
import {
  type ApplicationContent,
  applicationContentSchema,
  parseContent,
  type Section,
  sectionSchema,
  type SectionType,
} from '../domain/content-schema';
import type { CvStructured } from '../domain/cv-schema';
import type { ModelId, Tier } from '../domain/enums';
import { errors } from '../domain/errors';
import { z } from 'zod';

import type { AIProvider } from '../ports/ai-provider';
import type { OnProgress } from './progress';

// ──────────────────────────────────────────────────────────────────────────
// Pipeline-Stufen ANALYZE → PLAN → WRITE als reine Funktionen über den AIProvider-Port.
// Modellwahl IMMER über modelFor() (Constitution Art. IV.3). Ehrlichkeit ist Pflicht-Constraint
// im WRITE-Prompt (Constitution Art. II: underpromise, nichts erfinden, saubere KI-Zeitleiste).
// ──────────────────────────────────────────────────────────────────────────

export interface ProfileForGen {
  displayName: string | null;
  cv: CvStructured | null;
  contact: { email?: string; phone?: string; location?: string };
}

/** Gemeinsamer Rückgabewert jeder KI-Stufe inkl. Observability-Daten. */
export interface StepMeta {
  costCents: number;
  modelUsed: ModelId;
}

async function runJson(
  ai: AIProvider,
  args: { stage: TaskKind; tier: Tier; system: string; user: string; maxTokens: number; effort?: 'medium' | 'high' },
): Promise<{ raw: unknown; meta: StepMeta }> {
  const model = modelFor(args.stage, args.tier);
  let cost = 0;
  let lastErr: unknown;
  // Zwei Versuche: LLMs verpacken JSON gelegentlich in Fences/Prosa. Beim zweiten Versuch
  // verschärfen wir die Anweisung. So scheitert die Generierung NICHT an einem einmaligen
  // Format-Ausrutscher (Robustheit-Pflicht, ADR 0012 / Task #37).
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const system =
      attempt === 0
        ? args.system
        : `${args.system}\n\nWICHTIG: Antworte AUSSCHLIESSLICH mit reinem, gültigem JSON — keine Code-Fences, kein Markdown, keine Erklärung davor oder danach. Beginne mit { und ende mit }.`;
    const res = await ai.complete({
      model,
      system,
      messages: [{ role: 'user', content: args.user }],
      cacheBreakpoints: [0], // System-Prompt cachen (Prompt-Caching Pflicht)
      maxTokens: args.maxTokens,
      effort: args.effort,
    });
    cost += res.costCents;
    try {
      return { raw: extractJson(res.text), meta: { costCents: cost, modelUsed: res.modelUsed } };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? errors.validation('Modellausgabe ist kein gültiges JSON — bitte erneut versuchen.');
}

// Robuste JSON-Extraktion aus LLM-Text: entfernt Code-Fences, findet das erste VOLLSTÄNDIGE
// JSON-Objekt/-Array per balanciertem Scan (ignoriert Prosa davor/danach), repariert Trailing-Commas.
function extractJson(text: string): unknown {
  const cleaned = text.replace(/```+\s*(?:json|javascript)?/gi, '').replace(/```+/g, '');
  const candidate = firstJsonValue(cleaned) ?? cleaned.trim();
  for (const variant of [candidate, candidate.replace(/,(\s*[}\]])/g, '$1')]) {
    try {
      return JSON.parse(variant);
    } catch {
      /* nächste Variante versuchen */
    }
  }
  throw errors.validation('Modellausgabe ist kein gültiges JSON — bitte erneut versuchen.');
}

/** Findet das erste vollständige, balancierte JSON-Objekt/-Array (string-/escape-bewusst). */
function firstJsonValue(text: string): string | null {
  const candidates = [text.indexOf('{'), text.indexOf('[')].filter((i) => i >= 0);
  if (candidates.length === 0) return null;
  const start = Math.min(...candidates);
  const open = text[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null; // unbalanciert (z. B. abgeschnitten) → Aufrufer versucht Reparatur/Retry
}

// ── ANALYZE [Haiku] ────────────────────────────────────────────────────────

export const jobAnalysisSchema = z.object({
  companyName: z.string().nullish(),
  role: z.string().nullish(),
  requirements: z.array(z.string()).default([]),
  niceToHave: z.array(z.string()).default([]),
  tone: z.string().nullish(),
  brandHints: z
    .object({ colors: z.array(z.string()).default([]), keywords: z.array(z.string()).default([]) })
    .default({ colors: [], keywords: [] }),
});
export type JobAnalysis = z.infer<typeof jobAnalysisSchema>;

const ANALYZE_SYSTEM = [
  'Du analysierst eine Stellenanzeige und gibst NUR gültiges JSON zurück (kein Markdown):',
  '{ "companyName": string?, "role": string?, "requirements": string[], "niceToHave": string[],',
  '  "tone": string?, "brandHints": { "colors": string[], "keywords": string[] } }',
  '- requirements: die echten Muss-Anforderungen, knapp formuliert.',
  '- tone: kurze Beschreibung der Tonalität/Kultur der Firma (z. B. "nüchtern-technisch", "warm-nahbar").',
  '- brandHints.colors: erkennbare Markenfarben als Hex, falls aus der Anzeige ableitbar (sonst leer).',
  '- Nichts erfinden — nur extrahieren/zusammenfassen, was in der Anzeige steht.',
].join('\n');

export async function analyzeJob(
  ai: AIProvider,
  input: { jobText: string; tier: Tier },
): Promise<{ analysis: JobAnalysis; meta: StepMeta }> {
  const { raw, meta } = await runJson(ai, {
    stage: 'analyze',
    tier: input.tier,
    system: ANALYZE_SYSTEM,
    user: input.jobText.slice(0, 60_000),
    maxTokens: 2048,
  });
  return { analysis: jobAnalysisSchema.parse(raw), meta };
}

// ── PLAN [Opus] ────────────────────────────────────────────────────────────

export const applicationPlanSchema = z.object({
  angle: z.string(),
  sections: z.array(z.string()).min(1),
  includeRoadmap: z.boolean().default(false),
  includeCollaboration: z.boolean().default(false),
  brandDirection: z.string().nullish(),
});
export type ApplicationPlan = z.infer<typeof applicationPlanSchema>;

const PLAN_SYSTEM = [
  'Du planst eine maßgeschneiderte Bewerbungs-Website. Gib NUR gültiges JSON zurück:',
  '{ "angle": string, "sections": string[], "includeRoadmap": boolean, "includeCollaboration": boolean, "brandDirection": string? }',
  'Verfügbare Sektionstypen (sections, in sinnvoller Reihenfolge wählen):',
  'hero, fit, experience, skills, education, projects, roadmap, collaboration, industry_match, honest, contact.',
  '- GOLDSTANDARD-REIHENFOLGE (mit CV) — IMMER in dieser Reihenfolge planen:',
  '  hero → fit → experience → projects → industry_match → roadmap → collaboration → honest → contact.',
  '  NIEMALS anders. Diese Reihenfolge ist bindend (Goldstandard N10).',
  '- "hero": Hook + Eyebrow + Job-spezifische Headline — KEIN generisches Intro.',
  '- "fit": mind. 4 Items — wörtliche Anforderungen aus der Stelle + konkrete Belege.',
  '- "experience": echte Stationen mit Projekten/Zahlen — kein CV-Dump-Stil.',
  '- "projects": echte Projekte/Referenzen (mit URL falls vorhanden) — "Schon gebaut"-Sektion.',
  '- "industry_match": PFLICHT — geht jede Stelle-Anforderung Punkt für Punkt durch ("Was ich übernehmen würde").',
  '- "roadmap": 3-Phasen-Fahrplan (Erste Tage/Wochen/Monate) — firmenspezifisch, KEIN generischer Plan.',
  '- "collaboration": Arbeitsmodell, Verfügbarkeit, Zusammenarbeit.',
  '- "honest": eine echte Lücke offen benennen + reframen (Constitution: underpromise).',
  '- OHNE CV (bewerber.cv null): hero → fit → skills → industry_match → roadmap → collaboration → honest → contact.',
  '  Keine erfundenen Stationen. Stütze dich auf schwerpunkt. Weiterhin mind. 8 Sektionen.',
  "- 'unterlagen' (falls vorhanden): echtes Zusatzmaterial aus hochgeladenen Dokumenten (Anschreiben/",
  '  Zertifikate) — daraus konkrete Belege, Skills und Stationen ableiten. Niemals erfinden.',
  '- angle: der rote Faden in einem Satz. brandDirection: Farb-/Ton-Idee passend zur Firma.',
].join('\n');

export async function planApplication(
  ai: AIProvider,
  input: {
    analysis: JobAnalysis;
    profile: ProfileForGen;
    focusPrompt?: string;
    extraMaterial?: string;
    tier: Tier;
    language: string;
  },
): Promise<{ plan: ApplicationPlan; meta: StepMeta }> {
  const user = JSON.stringify({
    sprache: input.language,
    analyse: input.analysis,
    bewerber: { name: input.profile.displayName, cv: input.profile.cv },
    schwerpunkt: input.focusPrompt ?? null,
    unterlagen: input.extraMaterial ? input.extraMaterial.slice(0, 30_000) : null,
  });
  const { raw, meta } = await runJson(ai, {
    stage: 'plan',
    tier: input.tier,
    system: PLAN_SYSTEM,
    user,
    maxTokens: 2048,
    effort: 'medium',
  });
  return { plan: applicationPlanSchema.parse(raw), meta };
}

// ── WRITE [Opus] ───────────────────────────────────────────────────────────

const WRITE_SYSTEM = [
  'Du schreibst den vollständigen Inhalt einer maßgeschneiderten Bewerbungs-Website als JSON.',
  'Gib NUR gültiges JSON nach EXAKT diesem Schema zurück (kein Markdown, keine Erklärung):',
  '{',
  '  "language": string,',
  '  "company": { "name": string?, "brand": { "ink": string?, "colors": string[], "fontFamily": string? }? },',
  '  "sections": Section[],',
  '  "media": []',
  '}',
  'Section ist eine getaggte Union über "type":',
  '- { "type":"hero", "name": string, "role": string?, "eyebrow": string?, "headline": string[], "pitch": string, "chips": string[], "cta": string? }',
  '- { "type":"fit", "intro": string?, "items": [{ "requirement": string, "evidence": string }] }',
  '- { "type":"experience", "items": [{ "role": string, "org": string?, "period": string?, "summary": string, "highlights": string[] }] }',
  '- { "type":"skills", "groups": [{ "label": string, "items": string[] }] }',
  '- { "type":"education", "items": [{ "degree": string, "org": string?, "period": string? }] }',
  '- { "type":"projects", "intro": string?, "items": [{ "name": string, "description": string, "url": string?, "tag": string? }] }',
  '- { "type":"roadmap", "phases": [{ "when": string, "focus": string }] }',
  '- { "type":"collaboration", "body": string }',
  '- { "type":"industry_match", "body": string }',
  '- { "type":"honest", "body": string }',
  '- { "type":"contact", "email": string?, "phone": string?, "location": string?, "ctaLine": string?, "links": [{ "label": string, "url": string }], "badge": boolean }',
  '',
  'HARTE REGELN (Constitution):',
  '- Schreibe ALLE Inhalte in der angegebenen Sprache.',
  '- EHRLICH bleiben, NICHTS erfinden. Nutze nur Fakten aus dem Bewerber-CV bzw. der Selbstbeschreibung.',
  '- OHNE CV (bewerber.cv = null): stütze dich allein auf die Selbstbeschreibung/Stichworte (schwerpunkt)',
  '  und den Namen. Lass experience/education/projects dann weg — KEINE erfundenen Stationen. Kürzer ist ok.',
  '- Bescheidener Ton (underpromise). "honest"-Sektion ordnet Lücken fair ein.',
  '- KI-Zeitleiste sauber halten: RAG/MCP/Automatisierung ab 2024, agentische Praxis erst ab Ende 2025 — nicht früher behaupten.',
  '- "fit": jede Anforderung der Stelle mit konkretem Beleg aus dem CV paaren.',
  '- "hero.headline": 1–3 kurze, starke Zeilen. "pitch": 1–2 Sätze.',
  '- company.name aus der Analyse; company.brand.colors aus brandHints, falls vorhanden.',
  '- hero.role = Rolle + Firma kurz (Kopfzeile). hero.chips = 3–5 kurze Schlagworte (Stärken/Verfügbarkeit).',
  '- contact.links: NUR echte Profil-Links (Website/LinkedIn/Portfolio aus dem Bewerber-Kontakt), nichts erfinden.',
  '- "projects": echte Projekte/Referenzen aus dem CV hervorheben (Name, knappe Beschreibung, url falls vorhanden).',
  '- Sei ausführlich & konkret (Goldstandard-Länge): mind. 4–5 fit-Items mit echten Belegen, 2–3 experience-',
  '  Einträge mit Highlights, skills in 2–3 Gruppen, 2–4 projects, eine roadmap mit 3 Phasen (erste Tage/Wochen/',
  '  Monate) und eine honest-Sektion. Lieber substanziell als knapp.',
].join('\n');

function buildWriteUser(input: {
  analysis: JobAnalysis;
  plan: ApplicationPlan;
  profile: ProfileForGen;
  focusPrompt?: string;
  language: string;
}): string {
  return JSON.stringify({
    sprache: input.language,
    plan: input.plan,
    analyse: input.analysis,
    bewerber: {
      name: input.profile.displayName,
      kontakt: input.profile.contact,
      cv: input.profile.cv,
    },
    schwerpunkt: input.focusPrompt ?? null,
  });
}

export async function writeApplication(
  ai: AIProvider,
  input: {
    analysis: JobAnalysis;
    plan: ApplicationPlan;
    profile: ProfileForGen;
    focusPrompt?: string;
    tier: Tier;
    language: string;
  },
): Promise<{ content: ApplicationContent; meta: StepMeta }> {
  const user = buildWriteUser(input);
  const first = await runJson(ai, {
    stage: 'write',
    tier: input.tier,
    system: WRITE_SYSTEM,
    user,
    maxTokens: 16384,
    effort: 'high',
  });
  let totalCents = first.meta.costCents;
  let modelUsed = first.meta.modelUsed;

  const parsed = applicationContentSchema.safeParse(first.raw);
  if (parsed.success) {
    return { content: parsed.data, meta: { costCents: totalCents, modelUsed } };
  }

  // Ein begrenzter Reparatur-Versuch: Schema-Fehler zurückgeben, exakt korrigieren lassen.
  const repair = await runJson(ai, {
    stage: 'write',
    tier: input.tier,
    system: WRITE_SYSTEM,
    user:
      user +
      '\n\nDein letzter Output verletzte das Schema. Fehler:\n' +
      JSON.stringify(parsed.error.issues.slice(0, 12)) +
      '\nGib korrigiertes, vollständiges JSON nach dem Schema zurück.',
    maxTokens: 16384,
    effort: 'high',
  });
  totalCents += repair.meta.costCents;
  modelUsed = repair.meta.modelUsed;
  // parseContent wirft bei erneutem Fehlschlag (→ vom Service als Fehler behandelt).
  return { content: parseContent(repair.raw), meta: { costCents: totalCents, modelUsed } };
}

// ── WRITE (parallel, pro Sektion) ──────────────────────────────────────────
// Statt EINES großen 16k-Token-Calls (~2–3 Min) schreiben wir jede Sektion in einem eigenen,
// kleinen Call — alle gleichzeitig (Promise.all). Wall-Clock = langsamste Einzel-Sektion (~30 s).
// Goldstandard-Dichte pro Sektion ist Pflicht (die alte „eine kurze Seite" war ein Fehler).

const SECTION_SHAPES: Record<SectionType, string> = {
  hero: '{ "type":"hero", "name": string, "role": string?, "eyebrow": string?, "headline": string[], "pitch": string, "chips": string[], "cta": string? }',
  fit: '{ "type":"fit", "intro": string?, "items": [{ "requirement": string, "evidence": string }] }',
  experience:
    '{ "type":"experience", "items": [{ "role": string, "org": string?, "period": string?, "summary": string, "highlights": string[] }] }',
  skills: '{ "type":"skills", "groups": [{ "label": string, "items": string[] }] }',
  education: '{ "type":"education", "items": [{ "degree": string, "org": string?, "period": string? }] }',
  projects:
    '{ "type":"projects", "intro": string?, "items": [{ "name": string, "description": string, "url": string?, "tag": string? }] }',
  roadmap: '{ "type":"roadmap", "phases": [{ "when": string, "focus": string }] }',
  collaboration: '{ "type":"collaboration", "body": string }',
  industry_match: '{ "type":"industry_match", "body": string }',
  honest: '{ "type":"honest", "body": string }',
  contact:
    '{ "type":"contact", "email": string?, "phone": string?, "location": string?, "ctaLine": string?, "links": [{ "label": string, "url": string }], "badge": boolean }',
};

/** Goldstandard-Dichte je Sektion — DETERMINISTISCHE Formeln, kein Interpretationsspielraum. */
const SECTION_DEPTH: Partial<Record<SectionType, string>> = {
  hero: [
    'eyebrow: IMMER "{KANDIDATEN-FACHBEREICH} TRIFFT {UNTERNEHMENS-KERN}" in ALLEN CAPS',
    '(z. B. "IMMOBILIENWISSEN TRIFFT KI-PLATTFORM" — Kandidaten-Domäne → Firmen-Thema).',
    'headline[0]: EIN Satz, der die TRANSFORMATION benennt, die der Kandidat für diese Firma leisten wird.',
    'NIEMALS generisch ("Ich bin Experte für...") — immer auf DIESE Stelle/Firma bezogen.',
    'pitch: 2–3 Sätze: warum DIESER Mensch für DIESE Stelle — Cross-link Hintergrund → Firmen-Welt.',
    'chips: 4–5 ECHTE Fakten ("10+ Jahre [Branche]", "seit ~2024 KI", "[Verfügbarkeit]") — keine generischen Schlagworte.',
  ].join(' '),

  fit: [
    'intro (PFLICHT, 1–2 Sätze): Paraphrasiere was das Unternehmen laut Anzeige sucht + direkte Positionierung.',
    'NUR Items einbauen, für die das Profil einen ECHTEN Beleg liefert.',
    'Kein Beleg im Profil → Item weglassen. Lieber 2 ehrliche Items als 5 erfundene.',
    'requirement = WÖRTLICHE Formulierung aus analyse.requirements.',
    'evidence = Was das Profil TATSÄCHLICH belegt — konkret, aber NUR mit echten Fakten aus CV/schwerpunkt.',
  ].join(' '),

  experience: [
    '2–3 Einträge; je summary 2–3 Sätze. Highlights: NUR was im CV steht (Zahlen/Projekte).',
    'Kein Highlight erfinden wenn das CV keine Zahl nennt.',
  ].join(' '),

  skills: '2–3 Gruppen mit je 4–8 Skills. NUR Skills aus CV/schwerpunkt — keine freien Ergänzungen.',

  projects: [
    'intro: "Ein paar Dinge in der Richtung habe ich schon gemacht." (oder Variante).',
    'NUR echte Projekte aus CV/schwerpunkt. Keine URL erfinden.',
  ].join(' '),

  industry_match: [
    'Geht Anforderungen aus analyse.requirements durch.',
    'body-Format: "Was ich bei [companyName] übernehmen würde.\\n\\n',
    '01 · [WÖRTLICHE ANFORDERUNG]\\n[Stärken-Titel SOFERN PROFIL ES BELEGT]\\n[2–3 Sätze]\\n\\n02 · ..."',
    'EHRLICHKEITS-GATE: Hat das Profil KEINEN Beleg für eine Anforderung → ehrlich formulieren',
    '("wäre für mich neu" / "würde ich mir in den ersten Wochen aneignen") — NIEMALS Kompetenz erfinden.',
    'Kein Fließtext ohne Struktur.',
  ].join(' '),

  roadmap: [
    'GENAU 3 Phasen:',
    'when[0]="Erste Tage", when[1]="Erste Wochen", when[2]="Erste Monate".',
    'focus: stellenspezifische Aktionen basierend auf den Anforderungen aus der Anzeige.',
  ].join(' '),

  collaboration: 'body 80–140 Wörter: Arbeitsmodell, Verfügbarkeit, Zusammenarbeit — nur was im Profil steht.',

  honest: [
    'body 80–140 Wörter: EINE echte Diskrepanz zwischen Stelle und Profil direkt benennen',
    '(NUR was im Material erkennbar ist, NIEMALS erfinden), dann fair reframen.',
    'Ton: bodenständig, direkt.',
  ].join(' '),
};

const WRITE_SECTION_SYSTEM = [
  'Du schreibst GENAU EINE Sektion einer maßgeschneiderten Bewerbungs-Website.',
  'Du bekommst einen "sektionstyp" und gibst NUR dieses eine JSON-Objekt zurück — kein Markdown,',
  'keine Erklärung, kein Wrapper, exakt nach der angegebenen Form für genau diesen Typ.',
  '',
  '════ EHRLICHKEITS-GATE — OBERSTE PRIORITÄT, SCHLÄGT ALLE ANDEREN REGELN ════',
  'Behaupte AUSSCHLIESSLICH, was WÖRTLICH oder eindeutig impliziert im bewerber.cv oder schwerpunkt steht.',
  'Kein Beleg im Profil für eine Aussage → Aussage weglassen oder als Zukunftsplan formulieren.',
  '',
  'VERSCHÄRFTE REGELN — Häufigste Halluzinations-Muster:',
  '  VERBOTEN: aus "Erfahrung mit X" → "X produktiv eingesetzt", "X in Produktion gebracht", "X betrieben"',
  '  VERBOTEN: aus "kennt Y" / "beschäftigt sich mit Y" → "Y als primäres Werkzeug", "jahrelange Y-Erfahrung"',
  '  VERBOTEN: aus "hat MCP/RAG/Automatisierung gemacht" → "MCP-Tools geplant, gebaut und betrieben"',
  '  VERBOTEN: Kompetenzstufe erfinden — nur schreiben was das Profil belegt, nicht was naheliegt',
  '  VERBOTEN: "produktionsreife Lösungen" wenn Profil nur allgemeine Erfahrung nennt',
  '  VERBOTEN: "ohne Eskalationspuffer" / "on budget / on time" ohne explizite Zahlen im Profil',
  '',
  'Konkret verboten (nie erfinden, auch nicht implizieren):',
  '  - Personalverantwortung / Teamführung ohne explizite Nennung im Profil',
  '  - Budgetverantwortung / Zahlen ohne explizite Nennung im Profil',
  '  - Zertifizierungen (ISO, ITIL, PMP etc.) ohne explizite Nennung im Profil',
  '  - Sprachkenntnisse ohne explizite Nennung im Profil',
  '  - Compliance / Audit / Vertragsverantwortung ohne explizite Nennung im Profil',
  '  - Projekte, Firmennamen, Technologien, die nicht im Profil stehen',
  '  - Erfahrungstiefe erfinden: "primäres Werkzeug", "jahrelang", "Kernkompetenz" ohne Beleg',
  '',
  'SELBSTTEST vor jeder Aussage: "Steht das WÖRTLICH oder eindeutig im Profil?" — Nein → weglassen.',
  'Wenn das Profil wenig Material enthält: lieber 2 ehrliche Punkte als 5 erfundene.',
  '══════════════════════════════════════════════════════════════════════════',
  '',
  'STELLENBEZUG (nach dem Ehrlichkeits-Gate):',
  '- Jede Sektion bezieht sich auf die konkrete Stelle und das Unternehmen.',
  '- KEIN generischer Lebenslauf-Stil. Frage pro Satz: "Warum ICH für DIESE Stelle?"',
  '',
  'FORMELN (nur anwenden wenn Profil-Material vorhanden):',
  '- HERO.eyebrow: "{KANDIDATEN-FACHBEREICH} TRIFFT {UNTERNEHMENS-KERN}" (ALLE CAPS) — nur aus echtem Profil.',
  '- HERO.headline[0]: eine Aussage die beschreibt was der Kandidat für die Firma leistet.',
  '- FIT.items.requirement: WÖRTLICHE Formulierung aus analyse.requirements.',
  '- FIT.items.evidence: NUR belegtes Material — kein Item wenn kein echter Beleg im Profil.',
  '- INDUSTRY_MATCH: nummerierte Anforderungen; wo kein Beleg → "wäre zu erarbeiten" statt erfinden.',
  '- ROADMAP.phases[].when: "Erste Tage" / "Erste Wochen" / "Erste Monate".',
  '- PROJECTS.intro: "Ein paar Dinge in der Richtung habe ich schon gemacht." (nur echte Projekte).',
  '',
  'WEITERE REGELN (Constitution):',
  '- Schreibe in der angegebenen Sprache.',
  '- OHNE CV (bewerber.cv = null): nur schwerpunkt + Name — keine erfundenen Stationen.',
  '- Bescheidener Ton (underpromise). KI-Zeitleiste: RAG/MCP/Automatisierung ab 2024, agentisch erst ab Ende 2025.',
  '- "contact.links": nur ECHTE Links aus bewerber.kontakt.',
  "- 'unterlagen' (falls vorhanden): als Faktenquelle — gleiche Ehrlichkeitsregeln.",
].join('\n');

export async function writeSection(
  ai: AIProvider,
  input: {
    sectionType: SectionType;
    analysis: JobAnalysis;
    plan: ApplicationPlan;
    profile: ProfileForGen;
    focusPrompt?: string;
    extraMaterial?: string;
    tier: Tier;
    language: string;
  },
): Promise<{ section: Section | null; meta: StepMeta }> {
  const fallbackMeta: StepMeta = { costCents: 0, modelUsed: modelFor('write', input.tier) };
  const user = JSON.stringify({
    sprache: input.language,
    sektionstyp: input.sectionType,
    form: SECTION_SHAPES[input.sectionType],
    dichte: SECTION_DEPTH[input.sectionType] ?? 'substanziell, konkret, Goldstandard-Länge.',
    angle: input.plan.angle,
    analyse: input.analysis,
    bewerber: { name: input.profile.displayName, kontakt: input.profile.contact, cv: input.profile.cv },
    schwerpunkt: input.focusPrompt ?? null,
    unterlagen: input.extraMaterial ? input.extraMaterial.slice(0, 20_000) : null,
  });
  try {
    const { raw, meta } = await runJson(ai, {
      stage: 'write',
      tier: input.tier,
      system: WRITE_SECTION_SYSTEM,
      user,
      maxTokens: 4096,
      // kein effort → kein Extended Thinking → ~5s statt ~30s pro Sektion
    });
    const parsed = sectionSchema.safeParse(raw);
    // Typ-Check: LLM darf keinen anderen Sektions-Typ als den angeforderten zurückgeben.
    if (!parsed.success || parsed.data.type !== input.sectionType) return { section: null, meta };
    return { section: parsed.data, meta };
  } catch {
    return { section: null, meta: fallbackMeta };
  }
}

const ALL_SECTION_TYPES: readonly SectionType[] = [
  'hero',
  'fit',
  'experience',
  'skills',
  'education',
  'projects',
  'roadmap',
  'collaboration',
  'industry_match',
  'honest',
  'contact',
];

type WriteParallelInput = {
  analysis: JobAnalysis;
  plan: ApplicationPlan;
  profile: ProfileForGen;
  focusPrompt?: string;
  extraMaterial?: string;
  tier: Tier;
  language: string;
};

/** Kontakt-Sektion deterministisch aus den Profildaten bauen — sie darf NIE von der KI abhängen. */
function buildContactSection(input: WriteParallelInput): Section {
  const c = input.profile.contact;
  const company = input.analysis.companyName ?? undefined;
  const ctaLine = company
    ? `Lassen Sie uns über die Rolle bei ${company} sprechen — ich freue mich auf den Austausch.`
    : 'Lassen Sie uns sprechen — ich freue mich auf den Austausch.';
  return {
    type: 'contact',
    email: c.email,
    phone: c.phone,
    location: c.location,
    ctaLine,
    links: [],
    badge: false,
  };
}

export async function writeApplicationParallel(
  ai: AIProvider,
  input: WriteParallelInput,
  onProgress?: OnProgress,
): Promise<{ content: ApplicationContent; meta: StepMeta }> {
  // Plan-Reihenfolge, nur gültige Typen, dedupe; hero garantiert zuerst. contact bauen wir
  // deterministisch (Profildaten) und hängen ihn am Ende an — keine KI-Abhängigkeit für Kontakt.
  const valid = new Set<string>(ALL_SECTION_TYPES);
  const planned = [...new Set(input.plan.sections.filter((s) => valid.has(s)) as SectionType[])];
  const middle = planned.filter((t) => t !== 'hero' && t !== 'contact');
  const order: SectionType[] = ['hero', ...middle];

  let costCents = 0;
  let modelUsed = modelFor('write', input.tier);

  // Echter Fortschritt: +1 pro tatsächlich fertig geschriebener Sektion (für den Live-Ladebalken).
  const total = order.length;
  let completed = 0;
  onProgress?.({ stage: 'write', current: 0, total });
  const round1 = await Promise.all(
    order.map((sectionType) =>
      writeSection(ai, { ...input, sectionType }).then((r) => {
        completed += 1;
        onProgress?.({ stage: 'write', current: completed, total });
        return r;
      }),
    ),
  );
  const slots: (Section | null)[] = round1.map((r) => {
    costCents += r.meta.costCents;
    modelUsed = r.meta.modelUsed;
    return r.section;
  });

  // Eine Retry-Runde für fehlgeschlagene Sektionen (Vollständigkeit/Goldstandard-Länge).
  const failed = slots.map((s, i) => (s === null ? i : -1)).filter((i) => i >= 0);
  if (failed.length > 0) {
    const retries = await Promise.all(
      failed.map((i) => writeSection(ai, { ...input, sectionType: order[i] as SectionType })),
    );
    failed.forEach((slotIdx, k) => {
      const r = retries[k];
      if (!r) return;
      costCents += r.meta.costCents;
      if (r.section) slots[slotIdx] = r.section;
    });
  }

  // Letzter Rettungsversuch: Hero ist kritisch — einmal extra, solo, mit erhöhtem Aufwand.
  if (slots[0]?.type !== 'hero') {
    const heroRetry = await writeSection(ai, { ...input, sectionType: 'hero' });
    if (heroRetry.section) {
      costCents += heroRetry.meta.costCents;
      slots[0] = heroRetry.section;
    }
  }
  if (slots[0]?.type !== 'hero') {
    // Ohne Hero ist die Seite unbrauchbar → als Fehlschlag behandeln (Service vergibt keinen Credit).
    throw errors.validation('Generierung unvollständig (kein Hero) — bitte erneut versuchen.');
  }

  const sections: Section[] = slots.filter((s): s is Section => s !== null);
  sections.push(buildContactSection(input));

  const colors = input.analysis.brandHints?.colors ?? [];
  const content = applicationContentSchema.parse({
    language: input.language,
    company: { name: input.analysis.companyName ?? undefined, brand: { colors } },
    sections,
    media: [],
  });
  return { content, meta: { costCents, modelUsed } };
}
