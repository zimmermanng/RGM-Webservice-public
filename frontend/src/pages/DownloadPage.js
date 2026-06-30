/**
 * Download page for Shuffle supporting materials.
 * It links to the offline Excel tool and documentation package from the public
 * downloads folder and explains when each file should be used.
 */
import React from "react";
import Card from "../components/Cards/Card";

const Download = () => {
  return (
    <div className="downloadPage" id="top">
      <header className="downloadHeader mainContainer">
        <h1>Downloads</h1>
        <h2>Vorlagen und Unterlagen</h2>
      </header>

      <section className="cardBox downloadCards" aria-label="Downloads">
        <Card
          title="Anwendungstool"
          description="Dieser Download enthält das Anwendungstool des SHUFFLE-Reifegradmodells im .xlsx Format. Nutzen Sie diese Datei, um über den Upload eine Selbstbewertung ohne den digitalen Fragebogen durchzuführen."
          link="./downloads/4-SHUFFLE-Reifegradmodell_Anwendungstool.xlsx"
          linkText="Datei herunterladen (.xlsx)"
          isDownload={true}
        />
        <Card
          title="Dokumentation"
          description="Dieser Download enthält die Dokumentation der Entwicklung des SHUFFLE-Reifegradmodell im .docx Format, sowie die zugrundeliegende Indikatorensammlung im .xlsx Format."
          link="./downloads/SHUFFLE_Dokumentation.zip"
          linkText="Dateien herunterladen (.zip)"
          isDownload={true}
        />
      </section>

      <section className="downloadNotes mainContainer" aria-labelledby="download-notes-title">
        <div className="reducedWidth">
          <h3 id="download-notes-title">Anmerkungen</h3>
          <h4>Anwendungstool</h4>
          <p>Die hinterlegte .xlsx-Datei kann genutzt werden,
            um eine Selbstbewertung ohne Verwendung des digitalen Fragebogens durchzuführen.
            Eine Anleitung zur Verwendung finden Sie in dem Dokument.
            Zur Auswertung kehren Sie auf diese Webseite zurück und navigieren auf den Reiter 'Upload',
            wo Sie dem dort beschriebenen Prozess folgen. Anschließend wird Ihnen das Ergebnis bereitgestellt.</p>
          <h4>Dokumentation</h4>
          <p>Die hinterlegte .zip-Datei beinhaltet zwei Dokumente.
            Das erste Dokument ist die <strong>Dokumentation</strong> der verschiedenen Phasen der Entwicklung des SHUFFLE-Reifegradmodells zu digitaler Barrierefreiheit an deutschen Hochschulen,
            in der der Entwicklungsprozess reflektiert, abstrahiert und zusammengefasst wurde.
            Diese Dokumentation kann als Inspiration und „Anleitung“ genutzt werden, um weitere Reifegradmodelle zu erstellen.
            Das zweite Dokument ist die <strong>Indikatorensammlung</strong>,
            die als Grundlage zur Entwicklung des SHUFFLE-Reifegradmodells erstellt und verwendet wurde.
            Auch diese Sammlung kann genutzt werden, um ein Reifegradmodell zu erstellen. Bitte beachten Sie jedoch, dass die Sammlung für den Hochschulkontext erstellt wurde und ergänzen Sie diese für ein Reifegradmodell für andere Bildungsbereiche.</p>
        </div>
      </section>
    </div>
  );
};

export default Download;
