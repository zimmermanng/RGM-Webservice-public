import React from "react";
import { Link } from "react-router-dom";
import "./navBar.css";

const HeaderDesktop = () => {
    return (
        <header className="HeaderDesktop">
            <div className="logo">
                <Link className="logotext" to="/">
                    <img src="LMZ-Logo.jpg" alt="LMZ Logo" />
                    <span>LMZ RGM-Prüfwerkzeug</span>
                </Link>
            </div>
            <nav>
                <ul>
                   {/* <li><Link to="/">Start</Link></li>
                    <li><Link to="/tutorial">Anleitung</Link></li>
                    <li><Link to="/download">Downloads</Link></li> */}
                    {/* Upload sichtbar – unabhängig vom Login */}
                    <li><Link to="/download">Downloads</Link></li>
                    <li><Link to="/upload">Upload</Link></li>
                    <li><Link to="/questionnaire">Fragebogen</Link></li>
                    <li><Link to="/dimensions">Dimensionen</Link></li>
                </ul>
            </nav>
        </header>
    );
};

export default HeaderDesktop;
