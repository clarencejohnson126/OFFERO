import type { ApplicationContent } from '@offero/core';
import type { ComponentType } from 'react';

import { SiteRenderer } from '../SiteRenderer';
import { BrutalistTemplate } from './brutalist';
import { EditorialTemplate } from './editorial';
import { SwissTemplate } from './swiss';
import { TerminalTemplate } from './terminal';

// Registry: Template-ID → Renderer. 'aurora' ist der bestehende Goldstandard (SiteRenderer);
// die übrigen vier sind eigenständige Layouts. Unbekannte/fehlende IDs fallen auf Aurora zurück.

type TemplateComponent = ComponentType<{ content: ApplicationContent }>;

const REGISTRY: Record<string, TemplateComponent> = {
  aurora: SiteRenderer,
  editorial: EditorialTemplate,
  terminal: TerminalTemplate,
  brutalist: BrutalistTemplate,
  swiss: SwissTemplate,
};

export function templateComponent(id: string | null | undefined): TemplateComponent {
  return (id && REGISTRY[id]) || SiteRenderer;
}
