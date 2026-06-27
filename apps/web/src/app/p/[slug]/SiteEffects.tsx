'use client';

import { useEffect } from 'react';

// Progress-Bar, Dot-Nav, Scroll-Reveals und Mailto-Toast für die generierte Bewerbungs-Website.
// Bewusst client-seitig & DOM-basiert, damit der Renderer ein reines Server-Component bleibt.
export function SiteEffects() {
  useEffect(() => {
    const root = document.querySelector('.os') as HTMLElement | null;
    if (!root) return;

    const prog = root.querySelector('[data-prog]') as HTMLElement | null;
    const onScroll = () => {
      const h = document.documentElement;
      const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) * 100;
      if (prog) prog.style.width = `${pct}%`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const reveals = Array.from(root.querySelectorAll('.os-reveal'));
    let io: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('os-in');
              io?.unobserve(e.target);
            }
          }),
        { threshold: 0.12 },
      );
      reveals.forEach((el) => io!.observe(el));
    } else {
      reveals.forEach((el) => el.classList.add('os-in'));
    }
    const fallback = window.setTimeout(() => reveals.forEach((el) => el.classList.add('os-in')), 1600);

    // Dot-Navigation aus allen [data-dot]-Sektionen aufbauen
    const sections = Array.from(root.querySelectorAll('[data-dot]')) as HTMLElement[];
    sections.forEach((s, i) => {
      if (!s.id) s.id = `os-sec-${i}`;
    });
    const dots = document.createElement('nav');
    dots.className = 'os-dots';
    for (const s of sections) {
      const a = document.createElement('a');
      a.href = `#${s.id}`;
      a.title = s.dataset.label ?? '';
      a.dataset.for = s.id;
      dots.appendChild(a);
    }
    root.appendChild(dots);
    let io2: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      io2 = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (e.isIntersecting) {
              dots.querySelectorAll('a').forEach((a) =>
                a.classList.toggle('os-active', (a as HTMLElement).dataset.for === e.target.id),
              );
            }
          }),
        { threshold: 0.5 },
      );
      sections.forEach((s) => io2!.observe(s));
    }

    const btn = root.querySelector('[data-mailto]') as HTMLAnchorElement | null;
    const onMail = () => {
      const email = (btn?.getAttribute('href') ?? '').replace('mailto:', '').split('?')[0];
      if (!email) return;
      try {
        void navigator.clipboard?.writeText(email);
      } catch {
        /* ignore */
      }
      const t = document.createElement('div');
      t.className = 'os-toast';
      t.textContent = `E-Mail kopiert: ${email}`;
      document.body.appendChild(t);
      requestAnimationFrame(() => (t.style.opacity = '1'));
      window.setTimeout(() => {
        t.style.opacity = '0';
        window.setTimeout(() => t.remove(), 300);
      }, 2600);
    };
    btn?.addEventListener('click', onMail);

    return () => {
      window.removeEventListener('scroll', onScroll);
      io?.disconnect();
      io2?.disconnect();
      window.clearTimeout(fallback);
      btn?.removeEventListener('click', onMail);
      dots.remove();
    };
  }, []);

  return null;
}
