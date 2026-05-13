import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = {
  default: [
    { label: "Startseite", to: "/start" },
    { label: "Downloads", to: "/download" },
    { label: "Upload", to: "/upload" },
    { label: "Dimensionen", to: "/dimensions" },
  ],
  LMZ: [
    { label: "Startseite", to: "/" },
    { label: "Konfigurationsmodus", to: "/dimensions/bearbeiten" },
    { label: "Fragebogen", to: "/dimensions" },
  ],
  ADMIN: [
    { label: "Struktur", to: "/"},
    { label: "Evaluationsrunden", to: "/placeholder"}
  ]
};

const LOGO_BY_COMPANY = {
  LMZ: "/LMZ-Logo.jpg",
  Shuffle: "/shuffle-logo.svg",
  default: "/LMZ-Logo.jpg",
};

function HeaderDesktop({ activeCompany, onLogout, team }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const hamburgerButtonRef = useRef(null);
  const firstMobileLinkRef = useRef(null);

  console.log(team)

  const navItems = useMemo(() => {
    if (team === "Administration") return NAV_ITEMS.ADMIN
    return NAV_ITEMS[activeCompany] || NAV_ITEMS.default;
  }, [activeCompany]);

  const logoSrc = LOGO_BY_COMPANY[activeCompany] || LOGO_BY_COMPANY.default;

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    if (path === "/dimensions") {
      return (
        location.pathname === "/dimensions" ||
        location.pathname.startsWith("/questionnaire")
      );
    }

    if (path === "/dimensions/bearbeiten") {
      return location.pathname.startsWith("/dimensions/bearbeiten");
    }

    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false);

    if (restoreFocus && hamburgerButtonRef.current) {
      window.setTimeout(() => {
        hamburgerButtonRef.current.focus();
      }, 0);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      if (firstMobileLinkRef.current) {
        firstMobileLinkRef.current.focus();
      }
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    closeMenu(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleLogoutClick = async () => {
    closeMenu(false);
    if (onLogout) {
      await onLogout();
    }
  };

  const homeTarget = activeCompany === "LMZ" ? "/" : "/start";

  return (
    <header className="Header">
      <div className="header-inner">
        <div className="logo">
          <Link
            className="logotext"
            to={homeTarget}
            onClick={() => closeMenu(false)}
          >
            <img src={logoSrc} alt={`${activeCompany || "LMZ"} Logo`} />
            <span className="logo-title">RGM-Prüfwerkzeug</span>
          </Link>
        </div>

        <nav className="nav-desktop" aria-label="Hauptnavigation">
          <ul>
            {navItems.map((item) => {
              const active = isActive(item.to);

              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={active ? "nav-link active" : "nav-link"}
                    aria-current={active ? "page" : undefined}
                    onClick={() => closeMenu(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="header-actions">
          {team && (
            <p
              className="team-indicator desktop-team-indicator"
              aria-label={`Aktuelle Organisationseinheit: ${team}`}
            >
              <span className="team-indicator-label">Organisationseinheit:</span>
              <span className="team-indicator-value">{team}</span>
            </p>
          )}

          <button
            type="button"
            className="logout-button desktop-logout-button"
            onClick={handleLogoutClick}
          >
            Logout
          </button>

          <button
            ref={hamburgerButtonRef}
            className="HamburgerMenu"
            type="button"
            onClick={toggleMenu}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label="Navigation öffnen oder schließen"
          >
            ☰
          </button>
        </div>
      </div>

      {isOpen && (
        <nav
          id="mobile-navigation"
          className="mobile-menu"
          aria-label="Mobile Hauptnavigation"
        >
          <ul>
            {navItems.map((item, index) => {
              const active = isActive(item.to);

              return (
                <li key={item.to}>
                  <Link
                    ref={index === 0 ? firstMobileLinkRef : null}
                    to={item.to}
                    className={active ? "nav-link active" : "nav-link"}
                    aria-current={active ? "page" : undefined}
                    onClick={() => closeMenu(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mobile-menu-meta">
            <button
              type="button"
              className="logout-button mobile-logout-button"
              onClick={handleLogoutClick}
            >
              Logout
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}

export default HeaderDesktop;