#!/usr/bin/env python3
"""Offero selbst testen: Stellenanzeige rein -> generierte Bewerbungs-Website raus.

Nutzung:
    python3 scripts/try-offero.py "Hier den Volltext der Stellenanzeige einfuegen..."
    python3 scripts/try-offero.py            # nimmt eine Beispiel-Anzeige
    python3 scripts/try-offero.py --no-open  # oeffnet Browser nicht

Flags:
    --no-open    Browser nicht oeffnen
    --keep       Bewerbung nach dem Test NICHT loeschen

Voraussetzung: Dev-Server laeuft (pnpm --filter @offero/web dev, Port 3001) und
apps/web/.env.local enthaelt die Supabase-/Anthropic-Keys.

Ehrlichkeit: nach der Generierung werden typische Halluzinations-Muster geprueft.
Credits: werden EINMAL pro Tag (idempotent via Tages-Datum als ref_id) gutgeschrieben
  — kein Credit-Aufbau bei wiederholten Laeufen am gleichen Tag.
Cleanup: die Testbewerbung wird am Ende automatisch geloescht (ausser --keep).
"""
import sys, json, time, subprocess, pathlib, urllib.request, urllib.error
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
ENVP = ROOT / "apps/web/.env.local"
API = "http://localhost:3001/api/v1"
EMAIL, PW = "tester@offero.local", "Test-Pass-123!"

SAMPLE_JOB = (
    "KI-Solution-Engineer (m/w/d). Du entwickelst produktionsreife GenAI-Loesungen: RAG-Systeme, "
    "LLM-API-Integrationen, agentische Workflows. Anforderungen: Erfahrung mit KI-/Automatisierungs"
    "projekten, TypeScript, eigenverantwortliche Projektsteuerung, Kundennaehe. Standort hybrid."
)

# Test-CV mit absichtlich ALLGEMEINER Erfahrung — kein "produktionsreif", kein "MCP betrieben".
# Die Honesty-Assertions unten pruefen, dass die KI nichts aufblaeht.
CV = {
    "summary": "M.Eng Projektmanagement, 10+ Jahre Projekt- & Bauleitung, seit 2024 KI-/Automatisierungspraxis (RAG, LLM-APIs, MCP).",
    "experience": [
        {"role": "Projekt- & Bauleiter", "org": "diverse Projekte", "period": "2014-2024",
         "highlights": ["Steuerung komplexer Bauprojekte", "Termin-, Kosten- & Qualitaetsverantwortung", "Stakeholder-Koordination"]},
        {"role": "KI- & Automatisierungspraxis", "org": "eigene Projekte", "period": "seit 2024",
         "highlights": ["RAG-Pipelines & LLM-API-Integrationen", "MCP-Tooling", "agentische Automatisierung (seit Ende 2025)"]},
    ],
    "education": [{"degree": "M.Eng Projektmanagement", "org": "Hochschule", "period": "-"}],
    "skills": ["RAG", "LLM-APIs", "MCP", "TypeScript", "Projektleitung", "Automatisierung"],
    "languages": [{"name": "Deutsch", "level": "Muttersprache"}, {"name": "Englisch", "level": "verhandlungssicher"}],
}

# Halluzinations-Muster, die im generierten Text NIEMALS auftauchen duerfen, wenn das CV
# nur allgemeine Erfahrung nennt (Ergebnis des Ehrlichkeits-Gates).
# Zwei Stufen. Offero ist NICHT der Faktenprüfer des Nutzers — es rahmt das vorhandene
# CV-/Prompt-Material ehrlich und taktisch klug. Tactisches Echo der Stellen-Sprache
# (z. B. "produktionsreife Lösungen" in einem Forward-Looking-Satz "würde ich entwickeln")
# ist KORREKT, kein Verstoß. Darum:
#
# HARD = erfundene CREDENTIALS, die im Test-CV definitiv NICHT stehen und nie ein
#        Forward-Looking-Frame sein können → echter Verstoß, Exit 1.
# SOFT = kontextabhängige Phrasen (Job-Echo, mögliche Inflation) → nur Hinweis, Exit 0.
#        Hier entscheidet der Satz-Kontext; ein Pauschal-Bann wäre kontext-blind und flaky.
HARD_FABRICATIONS = [
    "Teamführung",
    "Personalverantwortung",
    "Budgetverantwortung",
    "ISO-Zertifizierung",
    "ITIL",
    "PMP-Zertifizierung",
    "Scrum-Master-Zertifikat",
]
SOFT_FLAGS = [
    "produktionsreife Lösungen",
    "produktionsreifen Lösungen",
    "MCP-Tools geplant, gebaut und betrieben",
    "TypeScript als primäres Werkzeug",
    "TypeScript als Kernkompetenz",
    "ohne Eskalationspuffer",
    "on budget",
    "on time",
]


def env(p):
    d = {}
    for l in pathlib.Path(p).read_text().splitlines():
        l = l.strip()
        if l and not l.startswith("#") and "=" in l:
            k, v = l.split("=", 1)
            d[k.strip()] = v.strip().strip('"').strip("'")
    return d


def req(url, method="GET", headers=None, body=None, timeout=240):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "{}")


def collect_strings(node, out):
    """Sammelt REKURSIV alle Strings aus beliebig tief verschachtelten dict/list-Strukturen.
    Wichtig: erfasst auch verschachtelte Felder wie experience.items[].highlights[] und
    skills.groups[].items[] — sonst entstehen False-Negatives im Ehrlichkeits-Check."""
    if isinstance(node, str):
        out.append(node)
    elif isinstance(node, dict):
        for v in node.values():
            collect_strings(v, out)
    elif isinstance(node, (list, tuple)):
        for item in node:
            collect_strings(item, out)


def content_to_text(sections):
    """Alle Sektion-Inhalte als platten Text fuer Ehrlichkeits-Check (rekursiv, alle Tiefen)."""
    parts = []
    collect_strings(sections, parts)
    return "\n".join(parts)


def check_honesty(sections):
    """Prueft den generierten Text. Gibt (hard, soft) zurueck: hard = erfundene Credentials
    (echter Verstoss), soft = kontextabhaengige Hinweise (Job-Echo/moegliche Inflation)."""
    text = content_to_text(sections).lower()
    hard = [p for p in HARD_FABRICATIONS if p.lower() in text]
    soft = [p for p in SOFT_FLAGS if p.lower() in text]
    return hard, soft


def main():
    args = sys.argv[1:]
    no_open = "--no-open" in args
    keep = "--keep" in args
    pos_args = [a for a in args if not a.startswith("--")]
    job = pos_args[0] if pos_args else SAMPLE_JOB

    E = env(ENVP)
    URL = E["NEXT_PUBLIC_SUPABASE_URL"]
    ANON = E["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    SVC = E["SUPABASE_SERVICE_ROLE_KEY"]

    # 1) Test-Nutzer anmelden (anlegen, falls noetig)
    def signin():
        return req(f"{URL}/auth/v1/token?grant_type=password", "POST",
                   {"apikey": ANON, "Content-Type": "application/json"},
                   {"email": EMAIL, "password": PW})
    st, tok = signin()
    if st != 200:
        req(f"{URL}/auth/v1/admin/users", "POST",
            {"apikey": SVC, "Authorization": f"Bearer {SVC}", "Content-Type": "application/json"},
            {"email": EMAIL, "password": PW, "email_confirm": True})
        st, tok = signin()
    if st != 200:
        print("Login fehlgeschlagen:", tok)
        sys.exit(1)
    jwt, uid = tok["access_token"], tok["user"]["id"]

    sh = {"apikey": SVC, "Authorization": f"Bearer {SVC}", "Content-Type": "application/json",
          "Content-Profile": "offero", "Accept-Profile": "offero"}

    # 2) Profil + CV seeden
    req(f"{URL}/rest/v1/rpc/init_user", "POST", sh, {"p_user_id": uid})
    req(f"{URL}/rest/v1/profile?user_id=eq.{uid}", "PATCH", {**sh, "Prefer": "return=minimal"},
        {"display_name": "Clarence Weber",
         "contact": {"email": "clarence@example.com", "location": "Mannheim"},
         "cv_structured": CV})

    # 3) Credit gutschreiben — EINMAL pro Tag (tagesbasierte ref_id = idempotent).
    #    Mehrfache Laeufe am gleichen Tag geben keinen zweiten Credit.
    today = str(date.today())
    req(f"{URL}/rest/v1/rpc/grant_credits", "POST", sh,
        {"p_user_id": uid, "p_delta": 1, "p_reason": "purchase",
         "p_ref_id": f"smoke-{today}", "p_plan": None, "p_free_rerolls": None})

    ah = {"Authorization": f"Bearer {jwt}", "Content-Type": "application/json"}

    # 4) Bewerbung anlegen
    st, b = req(f"{API}/applications", "POST", ah, {"jobText": job, "titleHint": "Smoke-Test"})
    if st not in (200, 201):
        print("Anlegen fehlgeschlagen:", b)
        sys.exit(1)
    app_id = b["application"]["id"]
    slug = b["application"]["tenantSlug"]
    print(f"Bewerbung angelegt (slug: {slug}). Generiere ... (dauert ~20-40s)")

    # 5) Generieren
    t0 = time.time()
    st, b = req(f"{API}/applications/{app_id}/generate", "POST", ah, {"language": "de"})
    elapsed = round(time.time() - t0)
    if st != 200:
        print("Generierung fehlgeschlagen:", json.dumps(b)[:300])
        cleanup(ah, app_id, keep)
        sys.exit(1)

    secs = b["version"]["content"]["sections"]
    print(f"\nFertig! {elapsed}s · Modell={b['version']['modelUsed']}")
    print(f"Sektionen: {', '.join(s['type'] for s in secs)}")

    # 6) Ehrlichkeits-Check (zwei Stufen). HARD = erfundene Credentials → echter Verstoss (Exit 1).
    #    SOFT = kontextabhaengige Phrasen (Job-Echo/moegliche Inflation) → nur Hinweis, kein Fail.
    hard, soft = check_honesty(secs)
    if hard:
        print(f"\n❌ EHRLICHKEIT VERLETZT — erfundene Credentials ({len(hard)}):")
        for h in hard:
            print(f"   · \"{h}\"  (steht NICHT im CV → echte Aufblaehung)")
        print("   Pruefe EHRLICHKEITS-GATE in packages/core/src/generation/steps.ts")
        honesty_ok = False
    else:
        print("\n✅ Ehrlichkeit: keine erfundenen Credentials")
        honesty_ok = True
    if soft:
        print(f"ℹ️  Kontext-Hinweise ({len(soft)}) — manuell im Satz-Kontext pruefen, KEIN Fail:")
        for s in soft:
            print(f"   · \"{s}\"  (ok, wenn forward-looking / Job-Echo; nur pruefen bei Vergangenheits-Claim)")

    # 7) Laufzeit-Check
    if elapsed > 60:
        print(f"⚠️  Laufzeit {elapsed}s > 60s — Ursache pruefen (parallele writeSection-Calls?)")
    elif elapsed > 40:
        print(f"⚠️  Laufzeit {elapsed}s > 40s — leicht ueber Erwartung")

    site = f"http://localhost:3001/p/{slug}"
    print(f"\n  >>> {site}\n")
    if not no_open:
        try:
            subprocess.run(["open", site], check=False)
        except Exception:
            pass

    # 8) Cleanup
    cleanup(ah, app_id, keep)

    sys.exit(0 if honesty_ok else 1)


def cleanup(ah, app_id, keep):
    if keep:
        print(f"(--keep: Bewerbung {app_id} bleibt erhalten)")
        return
    st, _ = req(f"{API}/applications/{app_id}", "DELETE", ah)
    if st in (200, 204):
        print(f"(Testbewerbung {app_id} geloescht)")
    else:
        print(f"(Loeschen fehlgeschlagen, Status {st} — manuell entfernen: {app_id})")


if __name__ == "__main__":
    main()
