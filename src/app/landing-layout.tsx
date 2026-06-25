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
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return (
    <div className={`site-shell ${pathname === "/contact" ? "contact-theme" : ""}`}>
      <div className="ambient" aria-hidden="true">
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
          <span className="brand-name">LIVE SONG WAR</span>
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
