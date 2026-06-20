# Architecture Decision Records (ADRs)

Jede architektur- oder verfassungsrelevante Weiche wird hier als nummeriertes ADR festgehalten —
**nie nur im Chat**. Ein ADR ist kurz und unveränderlich; wird eine Entscheidung revidiert,
schreibt man ein **neues** ADR, das das alte als „Superseded by 000X" markiert.

## Format

```
# 000N — <Titel>

- Status: Proposed | Accepted | Superseded by 000X
- Datum: YYYY-MM-DD
- Kontext: Welches Problem / welche Kräfte?
- Entscheidung: Was wir tun.
- Konsequenzen: Was daraus folgt (gut & schlecht).
- Alternativen: Was wir verworfen haben und warum.
```

## Index

- [0001 — Fundament: Monorepo, API-first, Mobile-ready](./0001-fundament.md) · Accepted
- [0002 — MVP-Schnitt & Zielgruppe](./0002-mvp-scope-und-zielgruppe.md) · Zielgruppe gültig; MVP-Schnitt abgelöst von 0004
- [0003 — Technische Defaults, Markt & Sprache](./0003-tech-defaults-markt-sprache.md) · Accepted
- [0004 — MVP = volle Paket-Leiter](./0004-mvp-volle-paketleiter.md) · Accepted (löst 0002-MVP-Schnitt ab)
- [0005 — Feinschliff: in-place + Edit-Log](./0005-feinschliff-datenmodell.md) · Accepted
- [0006 — Supabase-Schema-Konventionen](./0006-schema-konventionen.md) · Accepted
