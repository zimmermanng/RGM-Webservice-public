import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="homePage" id="top">
      <section className="homeHero">
        <div className="homeHeroInner">
          <span className="homeEyebrow">LMZ</span>
          <h1 className="homeTitle">Reifegradmodell digitale Barrierefreiheit</h1>
          <p className="homeLead">
            Der Webservice unterstützt die Organisationseinheiten des LMZ dabei,
            den Stand der Umsetzung digitaler Barrierefreiheit strukturiert zu
            reflektieren, einzuordnen und gezielt weiterzuentwickeln.
          </p>

          <div className="homeHeroActions">
            <Link to="/dimensions/bearbeiten" className="homeButton">
              Start
            </Link>
          </div>
        </div>
      </section>

      <div className="homeContent">
        <section className="homeIntroCard">
          <h2>Worum geht es?</h2>
          <p>
            Ein Reifegradmodell (RGM) ist ein strukturiertes Instrument, mit dem
            Organisationen ihren aktuellen Entwicklungsstand in einem bestimmten
            Themenfeld erfassen und gemeinsam im Dialog reflektieren können. Es hilft dabei,
            systematisch einzuordnen, wo eine Organisation aktuell steht,
            welche Bereiche bereits „gut entwickelt“ sind und wo noch
            „Weiterentwicklungsbedarf“ besteht.
          </p>
          <p>
            Die Grundlage dafür sind mehrere aufeinander aufbauende
            Reifegradstufen, die einen typischen oder angestrebten
            Entwicklungspfad abbilden. Jede Reifegradstufe beschreibt
            einen Entwicklungsstand mit charakteristischen Merkmalen,
            anhand derer die Einordnung erfolgt. Die höchste Reifegradstufe
            stellt eine Exzellenzstufe dar.
          </p>
          <p>
            Das vorliegende Reifegradmodell dient dazu, den Stand der Umsetzung
            digitaler Barrierefreiheit innerhalb des LMZ ganzheitlich zu
            betrachten. Dabei geht es nicht nur um einzelne technische Maßnahmen,
            sondern auch um organisatorische Strukturen, Prozesse und Zuständigkeiten.
            Durch eine wiederholte Anwendung des Reifegradmodells wird es möglich,
            die Entwicklung der Organisation über einen längeren Zeitraum hinweg nachzuvollziehen.
          </p>
        </section>

        <section className="homeGrid">
          {/*           <article className="infoCard infoCardAccent">
            <h3>Lesemodus</h3>
            <p>
              Der Lesemodus bieten Ihnen die Möglichkeit die Bearbeitungsstände anderer Organisationseinheiten einzusehen. Dabei haben Sie Einsicht auf die bereits beantworteten Fragen und auch auf ggf. vorhandene Ergebnisse
            </p>
          </article>  */}

          <article className="infoCard">
            <h3>So ist der Webservice aufgebaut</h3>
            <p>Der Webservice zur Anwendung des Reifegradmodells besteht aus mehreren
              aufeinander aufbauenden Schritten.
            </p>
            <ul className="featureList">
              <li>Auswahl und Import der Fragenpäckchen</li>
              <li>Beantwortung der Fragen für die eigene Organisationseinheit</li>
              <li>Sichtung der Ergebnisse im Dialog in der Organisationseinheit</li>
            </ul>
          </article>
        </section>

        <section className="sectionBlock">
          <div className="sectionHeading">
            <span className="sectionKicker">Webservice</span>
            <h2>Die einzelnen Schritte</h2>
          </div>

          <div className="stepsGrid">
            <article className="stepCard">
              <div className="stepNumber">1</div>
              <h3>Päckchen importieren</h3>
              <p>
                Zu Beginn werden sogenannte „Päckchen“ importiert. Ein Päckchen
                bündelt thematisch zusammengehörige Fragen zu einem bestimmten
                Tätigkeits- oder Aufgabenbereich.
              </p>
              <p>
                Das Importieren erfolgt pro Referat, Querschnittsreferat oder
                Stabsstelle. Einer Organisationseinheit sind Sie bereits durch
                Ihre Auswahl beim Login zugeordnet.
              </p>
              <p>
                Bitte importieren Sie alle Päckchen, die für Ihre
                Organisationseinheit relevant sind, wenn der beschriebene Tätigkeitsbereich
                bei Ihnen schwerpunktmäßig bearbeitet wird.
                Einzelne Berührungspunkte mit einem Tätigkeitsbereich müssen in der Regel
                nicht berücksichtigt werden.
                So bearbeiten Sie nur Fragen, die Ihre Arbeitsrealität abbilden.
              </p>
              <p>
                Sollten Sie beim Beantworten der Fragen feststellen, dass das gewählte Päckchen doch nicht
                Ihren Aufgabenbereichen entspricht, können Sie das Päckchen im Konfigurationsmodus
                aus Ihrer Auswahlliste löschen. </p>
            </article>

            <article className="stepCard">
              <div className="stepNumber">2</div>
              <h3>Fragebogen bearbeiten</h3>
              <p>
                Innerhalb eines Päckchens werden mehrere Fragen gestellt, die
                sich auf bereits etablierte Strukturen, Prozesse oder Maßnahmen in
                Ihrer Organisationseinheit beziehen.
              </p>
              <p>
                Zu jeder Frage stehen fünf Antwortoptionen zur Verfügung.
                Gehen Sie in Ihrer Organisationseinheit in den Dialog miteinander und
                wählen Sie die Option, die den aktuellen Zustand in Ihrer Organisationseinheit
                am besten beschreibt. Im Fokus steht dabei die realistische Beschreibung,
                nicht die Bewertung dieses Zustands.
              </p>
              <p>
                Die in den Antwortoptionen genannten Maßnahmen oder Tools dienen als Beispiele.
                Prüfen Sie, ob diese oder vergleichbare Maßnahmen oder Tools in Ihrer Organisationseinheit
                verwendet werden, um eine Antwortoption als zutreffend zu bewerten.
              </p>
              <p>
                Passt eine Frage nicht zu Ihrer Arbeitsrealität, können Sie die
                Option „Keine Angabe“ wählen. Diese ist eine vollwertige Antwortoption,
                um irrelevante Fragen bei der Berechnung des Reifegrads nicht einzubeziehen.
              </p>
              <p>
                Die Bearbeitung des Fragebogens kann jederzeit unterbrochen und zu einem
                späteren Zeitpunkt fortgesetzt werden, eine Zwischenspeicherung der eingegebenen
                Daten erfolgt automatisch. Erst nach Abschluss eines Päckchens werden
                die Antworten in die Auswertung übernommen.
              </p>
            </article>

            <article className="stepCard">
              <div className="stepNumber">3</div>
              <h3>Ergebnisse verstehen</h3>
              <p>
                Die Ergebnisse des Reifegradmodells werden grafisch als Balkendiagramm aufbereitet.
                Die importierten Päckchen sind farblich voneinander abgesetzt
                und bilden die übergeordneten Dimensionen, anhand derer Ihre
                Organisationseinheit bewertet wurde.
              </p>
              <p>
                Innerhalb jeder Dimension werden thematisch enger gefasste
                Bereiche unterschieden, die als Handlungsfelder bezeichnet
                werden. Der Ausschlag eines Balkens zeigt an, in welcher
                Reifegradstufe sich Ihre Organisationseinheit innerhalb eines
                Handlungsfeldes aktuell befindet.
              </p>
              <p>
                Die Visualisierung ermöglicht einen schnellen Überblick über
                Stärken und Entwicklungsbedarfe in den jeweiligen
                Handlungsfeldern.
              </p>
              <p>
                Ergänzend zu den Ergebnissen werden konkrete,
                kontextbezogene Handlungsempfehlungen ausgegeben. Diese zeigen
                auf, welche Maßnahmen geeignet sein können, um den nächsten
                Reifegrad zu erreichen und die digitale Barrierefreiheit innerhalb eines Handlungsfeldes zu verbessern.
              </p>
            </article>
          </div>
        </section>

        <section className="noticeBlock" aria-labelledby="wichtiger-hinweis">
          <div className="noticeLabel">Wichtig</div>
          <div>
            <h2 id="wichtiger-hinweis">Unterstützungs- und Entwicklungsinstrument</h2>
            <p>
              Das Reifegradmodell ist ausdrücklich als Unterstützungs- und
              Entwicklungsinstrument zu verstehen. Es soll Diskussionen anregen,
              Transparenz schaffen und als Grundlage für Planung,
              Priorisierung und Weiterentwicklung der digitalen
              Barrierefreiheit dienen – nicht als Kontroll- oder
              Bewertungsinstrument.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HomePage;
