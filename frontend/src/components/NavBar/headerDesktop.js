import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Startseite", to: "/start" },
  { label: "Downloads", to: "/download" },
  { label: "Upload", to: "/upload" },
  { label: "Fragebogen", to: "/dimensions" },
];

const LOGO_SRC = "/shuffle-logo.svg";

function HeaderDesktop({ onLogout, team }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  const isActive = (path) => {
    if (path === "/dimensions") {
      return (
        location.pathname === "/dimensions" ||
        location.pathname.startsWith("/questionnaire")
      );
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogoutClick = async () => {
    closeMenu();
    if (onLogout) {
      await onLogout();
    }
  };

  return (
    <header className="Header">
      <div className="header-inner">
        <div className="logo">
          <Link className="logotext" to="/start" onClick={closeMenu}>
            <img src={LOGO_SRC} alt="Shuffle Logo" />
            <span>RGM-Prüfwerkzeug</span>
          </Link>
        </div>

        <nav className="nav-desktop" aria-label="Hauptnavigation">
          <ul>
            {NAV_ITEMS.map((item) => (
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
            {NAV_ITEMS.map((item) => (
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

            {team && (
              <li className="mobile-team-row">
                <span className="team-indicator">{team}</span>
              </li>
            )}

            {onLogout && (
              <li>
                <button
                  type="button"
                  className="logout-button logout-button--mobile"
                  onClick={handleLogoutClick}
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}

export default HeaderDesktop;
