// src/pages/DownloadPage.js
import React from "react";
import Card from "../components/Cards/Card";

const Download = () => {
  return (
    <main className="downloadPage" id="top">
      <header className="downloadHeader mainContainer">
        <h1>Downloads</h1>
        <h2>Vorlagen und Unterlagen</h2>
      </header>

      <section className="cardBox downloadCards" aria-label="Downloads">
        <Card
          title="Shuffle Anwendungstool"
          description="Dieser Download enthält das Shuffle Anwendungstool im .xlsx Format. Nutzen Sie die Datei, um über den Upload eine Selbstevaluation ohne Fragebogen durchzuführen."
          link="./downloads/4-SHUFFLE-Reifegradmodell_Anwendungstool.xlsx"
          linkText="Datei Herunterladen (.xlsx)"
          isDownload={true}
        />
        <Card
          title="RGM-Dokumentation"
          description="Dieser Download enthält sowohl die .docx-Dokumentation, wie auch die .xlsx-Faktorensammlung. Weitere Informationen sind im Abschnitt 'Anmerkungen' enthalten."
          link="./downloads/SHUFFLE_Dokumentation.zip"
          linkText="Dateien Herunterladen (.zip)"
          isDownload={true}
        />
      </section>

      <section className="downloadNotes mainContainer" aria-labelledby="download-notes-title">
        <div className="reducedWidth">
          <h3 id="download-notes-title">Anmerkungen</h3>
          <h4>Shuffle Anwendungstool</h4>
          <p>Die hinterlegte .xlsx-Datei kann genutzt werden, um eine Selbstevaluation ohne Verwendung des Fragebogens zu ermöglichen. Hierfür steht Ihnen alternativ eine Matrix zur Verfügung, welche Sie basierend auf Ihren Erfahrungen ausfüllen können. Weitere Informationen finden Sie in dem Dokument. Zur Auswertung gehen Sie auf dieser Webseite auf den Reiter 'Upload' und führen den dort verfügbaren Prozess aus. Ihnen wird daraufhin das Ergebnis zur Verfügung gestellt.</p>
          <h4>Dokumentation der Entwicklung des SHUFFLE-Reifegradmodells zu digitaler Barrierefreiheit</h4>
          <p>Die verfügbare ZIP-Datei unter 'RGM-Dokumentation' beinhaltet zwei Dokumente: Die <strong>Dokumentation</strong> der verschiedenen Phasen der Entwicklung des SHUFFLE-Reifegradmodells zu digitaler Barrierefreiheit an deutschen Hochschulen. Wir haben dafür den Entwicklungsprozess reflektiert, abstrahiert und zusammengefasst. Diese Dokumentation kann als Inspiration und „Anleitung“ genutzt werden, um weitere Reifegradmodelle zu erstellen. Die <strong>Indikatoren-Sammlung</strong>, die als Grundlage zur Entwicklung des SHUFFLE-Reifegradmodells erstellt und verwendet wurde. Auch diese Sammlung kann genutzt werden, um ein Reifegradmodell zu erstellen. Aber bitte beachten Sie, dass die Sammlung für den Hochschulkontext erstellt wurde und ergänzen Sie diese für ein Reifegradmodell für andere Bildungsbereiche.</p>
        </div>
      </section>
    </main>
  );
};

export default Download;
