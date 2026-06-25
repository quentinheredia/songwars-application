"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    setNavHidden(false);
    let frameId = 0;

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const scrollDifference = currentScrollY - lastScrollY.current;

      if (currentScrollY <= 24) {
        setNavHidden(false);
      } else if (scrollDifference > 6) {
        setNavHidden(true);
      } else if (scrollDifference < -6) {
        setNavHidden(false);
      }

      lastScrollY.current = currentScrollY;

      if (!frameId) {
        frameId = window.requestAnimationFrame(() => {
          document.documentElement.style.setProperty(
            "--page-scroll-y",
            `${window.scrollY}px`,
          );
          frameId = 0;
        });
      }
    }

    document.documentElement.style.setProperty(
      "--page-scroll-y",
      `${window.scrollY}px`,
    );
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [pathname]);

  const pageTheme =
    pathname === "/contact"
      ? "contact-theme"
      : pathname === "/apply"
        ? "apply-theme"
        : "home-theme";

  return (
    <div className={`site-shell ${pageTheme}`}>
      <div className="ambient" aria-hidden="true">
        <div className="photo-layer photo-primary" />
        <div className="photo-layer photo-secondary" />
        <div className="photo-scrim" />
        <div className="beam beam-red" />
        <div className="beam beam-blue" />
        <div className="stage-haze" />
        <div className="noise" />
      </div>

      <nav
        className={`navbar ${navHidden ? "navbar-hidden" : ""}`}
        aria-label="Primary navigation"
      >
        <Link href="/" className="brand" aria-label="Live Song War home">
          <span className="brand-name">
            LIVE SONG <span className="brand-war war-word">WARS</span>
          </span>
        </Link>

        <div className="nav-actions">
          <Link
            className={`nav-link ${pathname === "/contact" ? "active" : ""}`}
            href="/contact"
          >
            Contact
          </Link>
          <Link
            className={`apply-button ${pathname === "/apply" ? "active" : ""}`}
            href="/apply"
          >
            Apply
          </Link>
        </div>
      </nav>

      <main className="main-content">{children}</main>
    </div>
  );
}
