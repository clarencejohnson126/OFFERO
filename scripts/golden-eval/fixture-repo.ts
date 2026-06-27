import type { EvalProfile, Repository } from '@offero/core';

// In-Memory-Repository nur für golden-eval: die Pipeline liest ausschließlich repo.profiles.get().
// Alle übrigen Sub-Repos werfen bei Zugriff — sie werden in der Eval-Strecke nicht gebraucht und
// sollen einen versehentlichen DB-/Schreibpfad sofort sichtbar machen, statt still zu schlucken.

const USER_ID = 'golden-eval-user';

function throwing<T extends object>(name: string): T {
  return new Proxy({} as T, {
    get: (_t, prop) => () => {
      throw new Error(`fixture-repo.${name}.${String(prop)} ist in golden-eval nicht verfügbar`);
    },
  });
}

export function fixtureRepo(profile: EvalProfile): { repo: Repository; userId: string } {
  const profileRow = {
    userId: USER_ID,
    displayName: profile.displayName,
    contact: profile.contact,
    cvRaw: null,
    cvStructured: profile.cvStructured,
    photo: null,
    toolStack: [],
    languages: [],
  };

  const repo = {
    profiles: {
      get: async (userId: string) => (userId === USER_ID ? profileRow : null),
      upsert: throwing<Repository['profiles']>('profiles').upsert,
    },
    applications: throwing<Repository['applications']>('applications'),
    versions: throwing<Repository['versions']>('versions'),
    media: throwing<Repository['media']>('media'),
    billing: throwing<Repository['billing']>('billing'),
    radar: throwing<Repository['radar']>('radar'),
  } as unknown as Repository;

  return { repo, userId: USER_ID };
}
