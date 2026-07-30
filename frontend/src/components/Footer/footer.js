//footer.js
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return(
        <div>
            <footer>
                    <ul>
                        <li><Link to="/impressum">Impressum</Link></li>
                        <li><Link to="/privacy">Datenschutz</Link></li>
                        <li><Link to="/accessibility">Erklärung zur Barrierefreiheit</Link></li>
                        <li><Link to="/sitemap">Sitemap</Link></li>
                    </ul>
            </footer>
        </div>
    )
}

export default Footer;
