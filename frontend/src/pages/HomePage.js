import { Link } from "react-router-dom";

function HomePage({ isAdmin }) {
  return (
    <div className="homePage" id="top">
      <section className="homeHero">
        <div className="homeHeroInner">
          <span className="homeEyebrow">LMZ</span>
          <h1 className="homeTitle">
            {isAdmin
              ? "Administration des Reifegradmodells"
              : "Reifegradmodell Digitale Barrierefreiheit"}
          </h1>
          <p className="homeLead">
            Der Webservice unterstützt die Organisationseinheiten des LMZ dabei, den Stand der Umsetzung digitaler Barrierefreiheit strukturiert zu reflektieren, einzuordnen und gezielt weiterzuentwickeln.
          </p>

          <div className="homeHeroActions">
            <Link
              to={isAdmin ? "/Struktur" : "/dimensions/bearbeiten"}
              className="homeButton"
            >
              Start
            </Link>
          </div>
        </div>
      </section>

      <div className="homeContent">
        <section className="homeIntroCard">
          <h2>Worum geht es?</h2>
          <p>
            Ein Reifegradmodell (RGM) ist ein strukturiertes Instrument, mit dem Organisationen ihren aktuellen Entwicklungsstand in einem bestimmten Themenfeld erfassen und gemeinsam im Dialog reflektieren können. Es hilft dabei, systematisch einzuordnen, wo eine Organisation aktuell steht, welche Bereiche bereits gut entwickelt sind und wo noch „Weiterentwicklungsbedarf“ besteht.
          </p>
          <p>
            Die Grundlage dafür sind mehrere aufeinander aufbauende Reifegradstufen, die einen typischen oder angestrebten Entwicklungspfad abbilden. Jede Reifegradstufe beschreibt einen Entwicklungsstand mit charakteristischen Merkmalen, anhand derer die Einordnung erfolgt. Die höchste Reifegradstufe stellt eine Exzellenzstufe dar.
          </p>
          <p>
            Das vorliegende Reifegradmodell dient dazu, den Stand der Umsetzung digitaler Barrierefreiheit innerhalb des LMZ ganzheitlich zu betrachten. Dabei geht es nicht nur um einzelne technische Maßnahmen, sondern auch um organisatorische Strukturen, Prozesse und Zuständigkeiten. Durch eine wiederholte Anwendung des Reifegradmodells wird es möglich, die Entwicklung der Organisation über einen längeren Zeitraum hinweg nachzuvollziehen.
          </p>
          {isAdmin && (<p>In diesem Adminbereich können Sie das Reifegradmodell verwalten.</p>)}
        </section>

        <section className="sectionBlock">
          <div className="sectionHeading">
            <span className="sectionKicker">
              {isAdmin ? "Administration" : "Webservice"}
            </span>
            <h2>{isAdmin ? "Die verschiedenen Funktionen" : "Die einzelnen Schritte"}</h2>
          </div>

          <div className="stepsGrid">
            <article className="stepCard">
              <div className="stepNumber">1</div>
              <h3>{isAdmin ? "Organisationsstruktur anpassen" : "Päckchen importieren"}</h3>

              {isAdmin ?
                (
                  <>
                    <p>Als Administrator können Sie Organisationseinheiten (z.B. Abteilungen, Referate, Stabsstellen) anlegen, umbenennen oder löschen. Das Umbenennen dient zugleich der Änderung der Reihenfolge der Einheiten, die alphabetisch ist.</p>
                    <p>Organisationseinheiten können hierarchisch auf maximal einer Ebene verschachtelt werden. So kann beispielsweise eine Abteilung mehrere Referate als untergeordnete Einheiten enthalten.</p>
                    <p>Die Bearbeitung des Reifegradmodells erfolgt stets auf den untersten verfügbaren Ebenen der Organisationsstruktur. Besitzt eine Organisationseinheit untergeordnete Einheiten, wird das Reifegradmodell von diesen bearbeitet. Hat eine Organisationseinheit keine untergeordneten Einheiten, erfolgt die Bearbeitung direkt auf der Einheit.</p>
                    <p>Für jede bearbeitende Organisationseinheit wird ein Passwort vergeben. Mit diesem Passwort melden sich die Mitarbeitenden der jeweiligen Einheit im Webservice an, um das Reifegradmodell auszufüllen.</p>
                    <p>Bitte beachten Sie, dass häufige oder umfangreiche Anpassungen die langfristige Vergleichbarkeit der Ergebnisse erschweren können.</p>
                  </>
                ) : (
                  <>
                    <p>
                      Zu Beginn werden sogenannte „Päckchen“ importiert. Ein Päckchen bündelt thematisch zusammengehörige Fragen zu einem bestimmten Tätigkeits- oder Aufgabenbereich.
                    </p>
                    <p>
                      Das Importieren erfolgt pro Referat, Querschnittsreferat oder Stabsstelle. Einer Organisationseinheit sind Sie bereits durch Ihre Auswahl beim Login zugeordnet.
                    </p>
                    <p>
                      Bitte importieren Sie alle Päckchen, die für Ihre Organisationseinheit relevant sind, wenn der beschriebene Tätigkeitsbereich bei Ihnen schwerpunktmäßig bearbeitet wird. Einzelne Berührungspunkte mit einem Tätigkeitsbereich müssen in der Regel nicht berücksichtigt werden. So bearbeiten Sie nur Fragen, die Ihre Arbeitsrealität abbilden.
                    </p>
                    <p>
                      Sollten Sie beim Beantworten der Fragen feststellen, dass das gewählte Päckchen doch nicht Ihren Aufgabenbereichen entspricht, können Sie das Päckchen im Konfigurationsmodus aus Ihrer Auswahlliste löschen.
                    </p>
                  </>
                )}
            </article>

            <article className="stepCard">
              <div className="stepNumber">2</div>
              <h3>{isAdmin ? "Evaluationsrunden verwalten" : "Fragebogen bearbeiten"}</h3>
              {isAdmin ?
                (
                  <>
                    <p>Als Administrator können Sie Evaluationsrunden verwalten. Eine Evaluationsrunde entspricht dabei einer Anwendung des Reifegradmodells innerhalb der Organisation.</p>
                    <p>Der zeitliche Abstand zwischen den Messungen ist frei wählbar, häufig wird das Reifegradmodell in einem jährlichen Turnus eingesetzt.</p>
                    <p>Für jede neue Messung wird eine Evaluationsrunde angelegt und mit einem Namen versehen, beispielsweise „Messung 2026“. Dieser Name wird den Mitarbeitenden beim Bearbeiten des Reifegradmodells angezeigt.</p>
                    <p>Nicht mehr benötigte Evaluationsrunden können gelöscht werden. Dabei werden jedoch sämtliche zugehörigen Ergebnisse unwiderruflich entfernt!</p>
                  </>
                ) : (
                  <>
                    <p>
                      Innerhalb eines Päckchens werden mehrere Fragen gestellt, die sich auf bereits etablierte Strukturen, Prozesse oder Maßnahmen in Ihrer Organisationseinheit beziehen.
                    </p>
                    <p>
                      Zu jeder Frage stehen fünf Antwortoptionen zur Verfügung. Gehen Sie in Ihrer Organisationseinheit in den Dialog miteinander und wählen Sie die Option, die den aktuellen Zustand in Ihrer Organisationseinheit am besten beschreibt. Im Fokus steht dabei die realistische Beschreibung, nicht die Bewertung dieses Zustands.
                    </p>
                    <p>
                      Die in den Antwortoptionen genannten Maßnahmen oder Tools dienen als Beispiele. Prüfen Sie, ob diese oder vergleichbare Maßnahmen oder Tools in Ihrer Organisationseinheit verwendet werden, um eine Antwortoption als zutreffend zu bewerten.
                    </p>
                    <p>
                      Passt eine Frage nicht zu Ihrer Arbeitsrealität, können Sie die Option „Keine Angabe“ wählen. Diese ist eine vollwertige Antwortoption, um irrelevante Fragen bei der Berechnung des Reifegrads nicht einzubeziehen.
                    </p>
                    <p>
                      Die Bearbeitung des Fragebogens kann jederzeit unterbrochen und zu einem späteren Zeitpunkt fortgesetzt werden, eine Zwischenspeicherung der eingegebenen Daten erfolgt automatisch. Erst nach Abschluss eines Päckchens werden die Antworten in die Auswertung übernommen.
                    </p>
                  </>
                )}
            </article>

            <article className="stepCard">
              <div className="stepNumber">3</div>
              <h3>{isAdmin ? "Ergebnisse einsehen" : "Ergebnisse verstehen"}</h3>
              {isAdmin
                ? (
                  <>
                    <p>Als Administrator können Sie die Ergebnisse laufender und abgeschlossener Evaluationsrunden jederzeit einsehen.</p>
                    <p>Der „Mittelwert“ zeigt den durchschnittlich erreichten Reifegrad aller teilnehmenden Organisationseinheiten je Päckchen und vermittelt einen Gesamteindruck des aktuellen Entwicklungsstands.</p>
                    <p>Der „Minimalwert“ zeigt den niedrigsten erreichten Reifegrad aller teilnehmenden Organisationseinheiten je Päckchen und macht Bereiche mit besonderem Entwicklungsbedarf sichtbar.</p>
                    <p>In den Detailinformationen eines Päckchens ist ersichtlich, welche Organisationseinheiten das Päckchen bearbeitet haben und welchen Reifegrad sie erreicht haben. So lässt sich nachvollziehen, wie sich das angezeigte Gesamtergebnis zusammensetzt.</p>
                    <p>Neben der Gesamtauswertung können Sie auch die Ergebnisse der einzelnen Organisationseinheiten einsehen.</p>
                    <p>Zur Weiterverwendung der Ergebnisse, beispielsweise in Präsentationen oder Berichten, können Sie die erzeugten Diagramme direkt als Grafiken herunterladen.</p>
                  </>
                ) : (
                  <>
                    <p>
                      Die Ergebnisse des Reifegradmodells werden grafisch als Balkendiagramm aufbereitet. Die importierten Päckchen sind farblich voneinander abgesetzt und bilden die übergeordneten Dimensionen, anhand derer Ihre Organisationseinheit bewertet wurde.
                    </p>
                    <p>
                      Innerhalb jeder Dimension werden thematisch enger gefasste Bereiche unterschieden, die als Handlungsfelder bezeichnet werden. Der Ausschlag eines Balkens zeigt an, in welcher Reifegradstufe sich Ihre Organisationseinheit innerhalb eines Handlungsfeldes aktuell befindet.
                    </p>
                    <p>
                      Die Visualisierung ermöglicht einen schnellen Überblick über Stärken und Entwicklungsbedarfe in den jeweiligen Handlungsfeldern.
                    </p>
                    <p>
                      Ergänzend zu den Ergebnissen werden konkrete, kontextbezogene Handlungsempfehlungen ausgegeben. Diese zeigen auf, welche Maßnahmen geeignet sein können, um den nächsten Reifegrad zu erreichen und die digitale Barrierefreiheit innerhalb eines Handlungsfeldes zu verbessern.
                    </p>
                  </>
                )}

            </article>
          </div>
        </section>

        <section className="noticeBlock" aria-labelledby="wichtiger-hinweis">
          <div className="noticeLabel">Wichtig</div>
          <div>
            <h2 id="wichtiger-hinweis">
              Unterstützungs- und Entwicklungsinstrument
            </h2>
            <p>
              Das Reifegradmodell ist ausdrücklich als Unterstützungs- und Entwicklungsinstrument zu verstehen. Es soll Diskussionen anregen, Transparenz schaffen und als Grundlage für Planung, Priorisierung und Weiterentwicklung der digitalen Barrierefreiheit dienen – nicht als Kontroll- oder Bewertungsinstrument.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HomePage;
