// src/pages/DownloadPage.js
import React from 'react';
import Card from '../components/Cards/Card';
import {MdFileDownload} from "react-icons/md";

const Download = () => {
    return (
        <div>
            <div className='mainContainer' id="top">
                <h1>Downloads</h1>
                <h2>Vorlagen und Unterlagen</h2>
                <p>Text zur Information des Werkzeugs. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>
            </div>
            <div className='cardBox'>
            <Card
                    icon={<MdFileDownload/>}
                    title="PDF Guide"
                    description="Lade dir die PDF-Anleitung herunter (Als Beispiel...)"
                    link="./downloads/4-SHUFFLE-Reifegradmodell_Anwendungstool.xlsx"
                    linkText="Herunterladen"
                    isDownload={true} // Mark this as a download card
                />
                <Card
                    icon={<MdFileDownload/>}
                    title="Checkliste"
                    description="Checkliste zur Barrierefreiheit (Als Beispiel...)"
                    link="./downloads/4-SHUFFLE-Reifegradmodell_Anwendungstool.xlsx"
                    linkText="Herunterladen"
                    isDownload={true} // Mark this as a download card
                />
                       <Card
                    icon={<MdFileDownload/>}
                    title="Checkliste"
                    description="Checkliste zur Barrierefreiheit (Als Beispiel...)"
                    link="./downloads/4-SHUFFLE-Reifegradmodell_Anwendungstool.xlsx"
                    linkText="Herunterladen"
                    isDownload={true} // Mark this as a download card
                />
                       <Card
                    icon={<MdFileDownload/>}
                    title="Checkliste"
                    description="Checkliste zur Barrierefreiheit (Als Beispiel...)"
                    link="./downloads/4-SHUFFLE-Reifegradmodell_Anwendungstool.xlsx"
                    linkText="Herunterladen"
                    isDownload={true} // Mark this as a download card
                />
                    <Card
                    icon={<MdFileDownload/>}
                    title="Checkliste"
                    description="Checkliste zur Barrierefreiheit (Als Beispiel...)"
                    link="./downloads/4-SHUFFLE-Reifegradmodell_Anwendungstool.xlsx"
                    linkText="Herunterladen"
                    isDownload={true} // Mark this as a download card
                />
       </div>
       <div className='mainContainer'>
                <h3>Anmerkungen</h3>
                <p>Text zur Information des Werkzeugs. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>
            </div>
        </div>
    );
};

export default Download;