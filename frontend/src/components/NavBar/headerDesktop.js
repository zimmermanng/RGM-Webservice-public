import React, { useMemo, useState } from "react";
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
};

const LOGO_BY_COMPANY = {
  LMZ: "/LMZ-Logo.jpg",
  Shuffle: "/shuffle-logo.svg",
  default: "/LMZ-Logo.jpg",
};

function HeaderDesktop({ activeCompany, onLogout, team }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = useMemo(() => {
    return NAV_ITEMS[activeCompany] || NAV_ITEMS.default;
  }, [activeCompany]);

  const logoSrc = LOGO_BY_COMPANY[activeCompany] || LOGO_BY_COMPANY.default;

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

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

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogoutClick = async () => {
    closeMenu();
    if (onLogout) {
      await onLogout();
    }
  };

  const homeTarget = activeCompany === "LMZ" ? "/" : "/start";

  return (
    <header className="Header">
      <div className="header-inner">
        <div className="logo">
          <Link className="logotext" to={homeTarget} onClick={closeMenu}>
            <img src={logoSrc} alt={`${activeCompany || "LMZ"} Logo`} />
            <span>RGM-Prüfwerkzeug</span>
          </Link>
        </div>

        <nav className="nav-desktop" aria-label="Hauptnavigation">
          <ul>
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={isActive(item.to) ? "nav-link active" : "nav-link"}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header-actions">
          {team && <span className="team-indicator">{team}</span>}

          <button
            type="button"
            className="logout-button"
            onClick={handleLogoutClick}
          >
            Logout
          </button>

          <button
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
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={isActive(item.to) ? "nav-link active" : "nav-link"}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              </li>
            ))}

            <li className="mobile-team-row">
              {team && <span className="team-indicator">{team}</span>}
            </li>

            <li>
              <button
                type="button"
                className="logout-button logout-button--mobile"
                onClick={handleLogoutClick}
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export default HeaderDesktop;