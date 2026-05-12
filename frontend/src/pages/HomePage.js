import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="homePage" id="top">
      <section className="homeHero">
        <div className="homeHeroInner">
          <span className="homeEyebrow">LMZ</span>
          <h1 className="homeTitle">Reifegradmodell digitale Barrierefreiheit</h1>
          <p className="homeLead">
            Der Webservice unterstützt Organisationseinheiten des LMZ dabei,
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

      <main className="homeContent">
        <section className="homeIntroCard">
          <h2>Worum geht es?</h2>
          <p>
            Ein Reifegradmodell ist ein strukturiertes Instrument, mit dem
            Organisationen ihren aktuellen Entwicklungsstand in einem bestimmten
            Themenfeld erfassen und reflektieren können. Es hilft dabei,
            systematisch einzuordnen, wo eine Organisation aktuell steht,
            welche Bereiche bereits gut entwickelt sind und wo noch
            Weiterentwicklungsbedarf besteht.
          </p>
          <p>
            Die Grundlage dafür sind mehrere aufeinander aufbauende
            Reifegradstufen, die einen typischen oder angestrebten
            Entwicklungspfad abbilden. Durch eine wiederholte Anwendung wird es
            möglich, Entwicklungen über einen längeren Zeitraum hinweg
            nachzuvollziehen.
          </p>
          <p>
            Das vorliegende Reifegradmodell dient dazu, den Stand der Umsetzung
            digitaler Barrierefreiheit innerhalb des LMZ ganzheitlich zu
            betrachten. Im Fokus stehen dabei nicht nur technische Maßnahmen,
            sondern auch organisationelle Strukturen, Prozesse und
            Zuständigkeiten.
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
            <ul className="featureList">
              <li>Päckchen auswählen und importieren</li>
              <li>Fragen realistisch für die eigene Einheit beantworten</li>
              <li>Ergebnisse grafisch auswerten</li>
              <li>Konkrete Handlungsempfehlungen ableiten</li>
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
                Organisationseinheit relevant sind. So bearbeiten Sie nur
                Fragen, die Ihre Arbeitsrealität tatsächlich abbilden.
              </p>
            </article>

            <article className="stepCard">
              <div className="stepNumber">2</div>
              <h3>Fragebogen bearbeiten</h3>
              <p>
                Innerhalb eines Päckchens werden mehrere Fragen gestellt, die
                sich auf etablierte Strukturen, Prozesse oder Maßnahmen in
                Ihrer Organisationseinheit beziehen.
              </p>
              <p>
                Zu jeder Frage stehen fünf Antwortoptionen zur Verfügung. Im
                Vordergrund steht eine möglichst realistische Selbsteinschätzung
                des aktuellen Zustands.
              </p>
              <p>
                Passt eine Frage nicht zu Ihrer Arbeitsrealität, können Sie die
                Option „keine Angabe“ wählen. Die Bearbeitung kann jederzeit
                unterbrochen und später fortgesetzt werden; Zwischenspeicherungen
                erfolgen automatisch. Erst nach Abschluss eines Päckchens werden
                die Antworten in die Auswertung übernommen.
              </p>
            </article>

            <article className="stepCard">
              <div className="stepNumber">3</div>
              <h3>Ergebnisse verstehen</h3>
              <p>
                Die Ergebnisse werden grafisch als Balkendiagramm aufbereitet.
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
            </article>
          </div>
        </section>

        <section className="sectionBlock">
          <div className="sectionHeading">
            <span className="sectionKicker">Ergebnisnutzung</span>
            <h2>Was Sie aus den Ergebnissen mitnehmen können</h2>
          </div>

          <div className="insightGrid">
            <article className="infoCard">
              <h3>Schneller Überblick</h3>
              <p>
                Die Visualisierung ermöglicht einen schnellen Überblick über
                Stärken und Entwicklungsbedarfe in den jeweiligen
                Handlungsfeldern.
              </p>
            </article>

            <article className="infoCard">
              <h3>Konkrete Handlungsempfehlungen</h3>
              <p>
                Ergänzend zu den Ergebnissen werden konkrete,
                kontextbezogene Handlungsempfehlungen ausgegeben. Diese zeigen
                auf, welche Maßnahmen geeignet sein können, um den nächsten
                Reifegrad zu erreichen.
              </p>
            </article>

            <article className="infoCard">
              <h3>Aktueller Pilotumfang</h3>
              <p>
                In der aktuellen Pilotphase sind ausschließlich die Ergebnisse
                Ihrer eigenen Organisationseinheit sichtbar. Diagramme anderer
                Organisationseinheiten sowie eine organisationsübergreifende
                Übersicht stehen derzeit noch nicht zur Verfügung.
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
      </main>
    </div>
  );
}

export default HomePage;
