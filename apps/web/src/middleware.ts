import { isReserved } from '@offero/core';
import { NextResponse, type NextRequest } from 'next/server';

// Multi-Tenant: <slug>.offero.app → intern auf /p/<slug> umschreiben (Wildcard-Subdomain).
// Reservierte Subdomains (eine Quelle der Wahrheit: core/tenancy) und der lokale Betrieb
// (localhost) bleiben unberührt.
export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').split(':')[0] ?? '';
  if (host.endsWith('.offero.app')) {
    const sub = host.slice(0, -'.offero.app'.length);
    if (sub && !sub.includes('.') && !isReserved(sub)) {
      const url = req.nextUrl.clone();
      // /p/ ist bereits das Tenant-Rendering; /r/ ist der cookieless View-Pixel/Beacon-Endpunkt
      // (GET + sendBeacon-POST). Beide dürfen NICHT in /p/<sub>/… umgeschrieben werden, sonst
      // landet das Beacon auf einer nicht existierenden Route (404) und page_view wird nie geschrieben.
      if (!url.pathname.startsWith('/p/') && !url.pathname.startsWith('/r/')) {
        url.pathname = `/p/${sub}${url.pathname === '/' ? '' : url.pathname}`;
        return NextResponse.rewrite(url);
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/|_next/|favicon.ico).*)'],
};
