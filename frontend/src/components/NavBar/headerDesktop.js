/**
 * Responsive Shuffle header with desktop links and a collapsible mobile menu.
 * Active states are based on the current route, with questionnaire subpages
 * grouped under the Fragebogen navigation item.
 */
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Startseite", to: "/start" },
  { label: "Downloads", to: "/download" },
  { label: "Upload", to: "/upload" },
  { label: "Fragebogen", to: "/dimensions" },
];

const LOGO_SRC = "/shuffle-logo.svg";

function HeaderDesktop() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  const isActive = (path) => {
    if (path === "/start") {
      return location.pathname === "/" || location.pathname === "/start";
    }

    if (path === "/dimensions") {
      return (
        location.pathname === "/dimensions" ||
        location.pathname.startsWith("/questionnaire")
      );
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleHeaderKeyDown = (event) => {
    if (event.key === "Escape") closeMenu();
  };

  return (
    <header className="Header" onKeyDown={handleHeaderKeyDown}>
      <div className="header-inner">
        <div className="logo">
          <Link className="logotext" to="/start" onClick={closeMenu}>
            <img src={LOGO_SRC} alt="Shuffle Logo" />
            <span>RGM-Prüfwerkzeug</span>
          </Link>
        </div>

        <nav className="nav-desktop" aria-label="Hauptnavigation">
          <ul>
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.to);

              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={active ? "nav-link active" : "nav-link"}
                    aria-current={active ? "page" : undefined}
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="header-actions">
          <button
            className="HamburgerMenu"
            type="button"
            onClick={toggleMenu}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label={isOpen ? "Navigation schließen" : "Navigation öffnen"}
          >
            <span aria-hidden="true">☰</span>
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
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.to);

              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={active ? "nav-link active" : "nav-link"}
                    aria-current={active ? "page" : undefined}
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}

export default HeaderDesktop;