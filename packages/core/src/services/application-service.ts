import { CreditService } from '../billing/credit-service';
import type { ApplicationContent, Brand, SelfIntro } from '../domain/content-schema';
import type { Application, GenerationVersion } from '../domain/entities';
import { errors } from '../domain/errors';
import type { Json } from '../domain/json';
import { GenerationPipeline } from '../generation/pipeline';
import type { OnProgress } from '../generation/progress';
import type { Repository } from '../ports/repository';
import { buildUniqueSlug } from '../tenancy/slug';

export interface CreateApplicationInput {
  jobUrl?: string;
  jobText?: string;
  /** z. B. "Firma Rolle" — Basis für den Tenant-Slug. */
  titleHint?: string;
  company?: Json;
  /** Rendering-Variante (Template-ID). Default 'aurora'. */
  template?: string;
}

export interface GenerateOptions {
  focusPrompt?: string;
  /** Ausgabesprache der Bewerbung; Default 'de'. */
  language?: string;
  /** Frisch gescrapter Anzeigentext (Streaming-Pfad) — überschreibt den gespeicherten jobText. */
  jobText?: string;
  /** Optionales Firmen-Brand-Kit (gescrapte Farben/Font). */
  brand?: Brand;
  /** Aggregierter Text aus hochgeladenen Unterlagen (echtes Material). */
  extraMaterial?: string;
  market?: 'dach' | 'intl';
  noindex?: boolean;
  showContactDetails?: boolean;
  /** Echtes Selbst-Intro (Video/Audio), vom Aufrufer aus Uploads gebaut. */
  selfIntro?: SelfIntro;
  /** Live-Fortschritts-Callback (echter Ladebalken). */
  onProgress?: OnProgress;
}

export class ApplicationService {
  private readonly credits: CreditService;

  constructor(
    private readonly repo: Repository,
    private readonly pipeline?: GenerationPipeline,
  ) {
    this.credits = new CreditService(repo.billing);
  }

  async list(userId: string): Promise<Application[]> {
    return this.repo.applications.listByUser(userId);
  }

  async get(userId: string, id: string): Promise<Application> {
    const app = await this.repo.applications.get(id);
    if (!app || app.userId !== userId) throw errors.notFound('Bewerbung nicht gefunden');
    return app;
  }

  /**
   * Öffentlicher Lese-Pfad (kein Auth): liefert NUR veröffentlichte Bewerbungen
   * (status in ready|shared) — kein Draft-Leak. Läuft serverseitig mit Service-Role (ADR 0006).
   */
  async getPublic(slug: string): Promise<{ application: Application; content: ApplicationContent } | null> {
    const app = await this.repo.applications.getBySlug(slug);
    if (!app || (app.status !== 'ready' && app.status !== 'shared')) return null;
    if (!app.currentVersionId) return null;
    const version = await this.repo.versions.get(app.currentVersionId);
    if (!version) return null;
    return { application: app, content: version.content };
  }

  async create(userId: string, input: CreateApplicationInput): Promise<Application> {
    await this.credits.ensureUser(userId);
    const base = input.titleHint ?? input.jobUrl ?? 'bewerbung';
    const slug = await buildUniqueSlug(
      base,
      async (candidate) => (await this.repo.applications.getBySlug(candidate)) !== null,
    );
    return this.repo.applications.create({
      userId,
      tenantSlug: slug,
      jobUrl: input.jobUrl ?? null,
      jobText: input.jobText ?? null,
      company: input.company ?? {},
      template: input.template,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id); // Ownership-Check
    await this.repo.applications.delete(id);
  }

  /**
   * Text-Generierung: Pipeline zuerst, Abbuchung (−1 Credit, idempotent je Bewerbung über ref_id)
   * erst NACH Erfolg. Bei Pipeline-Fehler wird nichts abgebucht, der Status geht zurück auf 'draft'
   * und der Job-Text bleibt für einen Retry erhalten. Ein Guthaben-Vorabcheck verhindert teure
   * Pipeline-Läufe für Nutzer ohne Credits.
   */
  async generate(
    userId: string,
    id: string,
    opts: GenerateOptions = {},
  ): Promise<{ application: Application; version: GenerationVersion }> {
    if (!this.pipeline) {
      throw errors.notImplemented('Generierung benötigt ANTHROPIC_API_KEY in der Umgebung.');
    }
    const app = await this.get(userId, id); // Ownership-Check
    // Im Streaming-Pfad reicht der Aufrufer den frisch gescrapten Anzeigentext durch.
    const jobText = (opts.jobText ?? app.jobText)?.trim();
    if (!jobText) {
      throw errors.validation('Keine Stellenanzeige hinterlegt (jobText) — zuerst setzen.');
    }

    await this.credits.ensureUser(userId);
    const wallet = await this.repo.billing.getWallet(userId);

    // Credit ATOMAR VOR der Pipeline abbuchen — verhindert Race wenn Version schon
    // öffentlich ist bevor der Ledger-Eintrag existiert. ref_id mit Timestamp damit
    // Re-Generierungen derselben Application korrekt erneut abgerechnet werden.
    const genRef = `${app.id}:gen:${Date.now()}`;
    await this.credits.spendForGeneration(userId, genRef);

    await this.repo.applications.setStatus(app.id, 'generating');

    let generationDone = false;
    try {
      const result = await this.pipeline.run(
        {
          userId,
          applicationId: app.id,
          tier: wallet?.plan ?? 'free',
          language: opts.language ?? 'de',
          jobText,
          focusPrompt: opts.focusPrompt,
          brand: opts.brand,
          extraMaterial: opts.extraMaterial,
          market: opts.market,
          noindex: opts.noindex,
          showContactDetails: opts.showContactDetails,
          selfIntro: opts.selfIntro,
        },
        opts.onProgress,
      );

      const version = await this.repo.versions.create({
        applicationId: app.id,
        kind: 'generation',
        content: result.content,
        modelUsed: result.modelUsed,
        costCents: result.costCents,
      });
      await this.repo.applications.setCurrentVersion(app.id, version.id);
      await this.repo.applications.setStatus(app.id, 'ready');
      await this.repo.applications.clearJobText(app.id); // DSGVO: transienten Job-Text leeren
      generationDone = true;

      const updated = (await this.repo.applications.get(app.id)) ?? app;
      return { application: updated, version };
    } catch (e) {
      // Status nur auf draft zurücksetzen wenn die Version noch nicht gespeichert wurde.
      if (!generationDone) {
        await this.repo.applications.setStatus(app.id, 'draft').catch(() => {});
        // Credit zurückbuchen — Pipeline ist gescheitert, Nutzer soll keinen Credit verlieren.
        await this.credits.refundForGeneration(userId, genRef).catch(() => {});
      }
      throw e;
    }
  }
}
