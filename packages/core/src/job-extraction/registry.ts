// Geordnete Adapter-Registry: spezifische Hosts zuerst; der erste `match` gewinnt.
// Portal hinzufügen = eine Adapter-Datei + ein Eintrag hier. Der Dispatcher bleibt unverändert
// (open to extension, closed to modification). StepStone/Xing brauchen keinen Adapter — sie laufen
// über den generischen JSON-LD-Pfad im Dispatcher.

import { arbeitsagenturAdapter } from './adapters/arbeitsagentur';
import { ashbyAdapter } from './adapters/ashby';
import { greenhouseAdapter } from './adapters/greenhouse';
import { indeedAdapter } from './adapters/indeed';
import { leverAdapter } from './adapters/lever';
import { linkedinAdapter } from './adapters/linkedin';
import { personioAdapter } from './adapters/personio';
import { smartrecruitersAdapter } from './adapters/smartrecruiters';
import type { JobAdapter } from './types';

export const REGISTRY: readonly JobAdapter[] = [
  linkedinAdapter,
  indeedAdapter,
  arbeitsagenturAdapter,
  greenhouseAdapter,
  leverAdapter,
  ashbyAdapter,
  smartrecruitersAdapter,
  personioAdapter,
];
