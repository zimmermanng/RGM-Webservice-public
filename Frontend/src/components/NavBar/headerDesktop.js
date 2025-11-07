import React from "react";
import { Link } from "react-router-dom";
import "./navBar.css";

const HeaderDesktop = ({ activeCompany }) => {
  const getLogo = () => {
    if (activeCompany === "LMZ") {
      return "/LMZ-Logo.jpg"; 
    } else if(activeCompany==="Shuffle") {
      return "/shuffle-logo.svg"; 
    }
  };

  return (
    <header className="HeaderDesktop">
      <div className="logo">
        <Link className="logotext" to="/">
          <img src={getLogo()} alt="Logo" />
          <span>RGM-Prüfwerkzeug</span>
        </Link>
      </div>

      <nav>
        <ul>
           {/* <li><Link to="/questionnaire">Fragebogen</Link></li> */}
          <li><Link to="/download">Downloads</Link></li>
          <li><Link to="/upload">Upload</Link></li>
          <li><Link to="/dimensions">Dimensionen</Link></li>
        </ul>
      </nav>
    </header>
  );
};

export default HeaderDesktop;

