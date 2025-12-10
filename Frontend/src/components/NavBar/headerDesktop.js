import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./navBar.css";

const Header = ({ activeCompany }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getLogo = () => {
    if (activeCompany === "LMZ") return "/LMZ-Logo.jpg";
    if (activeCompany === "Shuffle") return "/shuffle-logo.svg";
    return "/LMZ-Logo.jpg";
  };

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="Header">
      <div className="header-inner">
        {/* LEFT: LOGO */}
        <div className="logo">
          <Link className="logotext" to="/" onClick={closeMenu}>
            <img src={getLogo()} alt="Logo" />
            <span>RGM-Prüfwerkzeug</span>
          </Link>
        </div>

        {/* RIGHT: DESKTOP NAV */}
        <nav className="nav-desktop">
          <ul>
            <li><Link to="/">Startseite</Link></li>
            <li><Link to="/download">Downloads</Link></li>
            <li><Link to="/upload">Upload</Link></li>
            <li><Link to="/dimensions">Dimensionen</Link></li>
          </ul>
        </nav>

        {/* RIGHT: MOBILE BURGER BUTTON */}
        <button
          className="HamburgerMenu"
          onClick={toggleMenu}
          aria-expanded={isOpen}
          aria-label="Navigation öffnen/schließen"
        >
          ☰
        </button>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="mobile-menu">
          <ul>
            <li><Link to="/" onClick={closeMenu}>Startseite</Link></li>
            <li><Link to="/download" onClick={closeMenu}>Downloads</Link></li>
            <li><Link to="/upload" onClick={closeMenu}>Upload</Link></li>
            <li><Link to="/dimensions" onClick={closeMenu}>Dimensionen</Link></li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Header;
