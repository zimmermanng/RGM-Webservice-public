/**
 * Footer navigation for legal and informational pages.
 * The links are kept as placeholders until they are connected to the later
 * external legal-service integration.
 */
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="siteFooter">
      {/* Reserved for a later external legal-service integration. */}
      <nav className="siteFooterNav" aria-label="Fußnavigation">
        <ul>
          <li><Link to="/impressum">Impressum</Link></li>
          <li><Link to="/privacy">Datenschutz</Link></li>
          <li><Link to="/accessibility">Erklärung zur Barrierefreiheit</Link></li>
          <li><Link to="/sitemap">Sitemap</Link></li>
        </ul>
      </nav>
    </footer>
  );
};

export default Footer;