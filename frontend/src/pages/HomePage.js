import { Link } from "react-router-dom";

function HomePage({ isAdmin }) {
  return (
    <div className="homePage" id="top">
      <section className="homeHero">
        <div className="homeHeroInner">
          <span className="homeEyebrow">LMZ!</span>
          <h1 className="homeTitle">
            {isAdmin 
              ? "Reifegradmodell – Administrationsbereich" 
              : "Reifegradmodell digitale Barrierefreiheit"}
          </h1>
          <p className="homeLead">
            {isAdmin 
              ? "Als Administrator haben Sie hier eine übergreifende Einsicht in die Auswertungen und Bearbeitungsstände der Organisationseinheiten des LMZ."
              : "Der Webservice unterstützt die Organisationseinheiten des LMZ dabei, den Stand der Umsetzung digitaler Barrierefreiheit strukturiert zu reflektieren, einzuordnen und gezielt weiterzuentwickeln."}
          </p>

          <div className="homeHeroActions">
            <Link 
              to={isAdmin ? "/Struktur" : "/dimensions/bearbeiten"} 
              className="homeButton"
            >
              {isAdmin ? "Zur Organisationsstruktur" : "Start"}
            </Link>
          </div>
        </div>
      </section>

      <div className="homeContent">
        <section className="homeIntroCard">
          <h2>{isAdmin ? "Lorem ipsum dolor sit" : "Worum geht es?"}</h2>
          <p>
            {isAdmin
              ? "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
              : "Ein Reifegradmodell (RGM) ist ein strukturiertes Instrument, mit dem Organisationen ihren aktuellen Entwicklungsstand in einem bestimmten Themenfeld erfassen und gemeinsam im Dialog reflektieren können. Es hilft dabei, systematisch einzuordnen, wo eine Organisation aktuell steht, welche Bereiche bereits „gut entwickelt“ sind und wo noch „Weiterentwicklungsbedarf“ besteht."}
          </p>
          <p>
            {isAdmin
              ? "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
              : "Die Grundlage dafür sind mehrere aufeinander aufbauende Reifegradstufen, die einen typischen oder angestrebten Entwicklungspfad abbilden. Jede Reifegradstufe beschreibt einen Entwicklungsstand mit charakteristischen Merkmalen, anhand derer die Einordnung erfolgt. Die höchste Reifegradstufe stellt eine Exzellenzstufe dar."}
          </p>
          <p>
            {isAdmin
              ? "Phasellus faucibus scelerisque eleifend donec pretium vulputate sapien nec sagittis. Neque egestas congue quisque egestas diam in arcu cursus euismod. Amet est placerat in egestas erat imperdiet sed euismod nisi."
              : "Das vorliegende Reifegradmodell dient dazu, den Stand der Umsetzung digitaler Barrierefreiheit innerhalb des LMZ ganzheitlich zu betrachten. Dabei geht es nicht nur um einzelne technische Maßnahmen, sondern auch um organisatorische Strukturen, Prozesse und Zuständigkeiten. Durch eine wiederholte Anwendung des Reifegradmodells wird es möglich, die Entwicklung der Organisation über einen längeren Zeitraum hinweg nachzuvollziehen."}
          </p>
        </section>

        <section className="homeGrid">
          <article className="infoCard">
            <h3>{isAdmin ? "Lorem ipsum dolor sit amet" : "So ist der Webservice aufgebaut"}</h3>
            <p>
              {isAdmin
                ? "Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore."
                : "Der Webservice zur Anwendung des Reifegradmodells besteht aus mehreren aufeinander aufbauenden Schritten."}
            </p>
            <ul className="featureList">
              <li>{isAdmin ? "Pellentesque habitant morbi tristique" : "Auswahl und Import der Fragenpäckchen"}</li>
              <li>{isAdmin ? "Senectus et netus et malesuada fames" : "Beantwortung der Fragen für die eigene Organisationseinheit"}</li>
              <li>{isAdmin ? "Ac turpis egestas integer eget aliquet" : "Sichtung der Ergebnisse im Dialog in der Organisationseinheit"}</li>
            </ul>
          </article>
        </section>

        <section className="sectionBlock">
          <div className="sectionHeading">
            <span className="sectionKicker">
              {isAdmin ? "Admin-Bereich" : "Webservice"}
            </span>
            <h2>{isAdmin ? "Lorem ipsum dolor" : "Die einzelnen Schritte"}</h2>
          </div>

          <div className="stepsGrid">
            <article className="stepCard">
              <div className="stepNumber">1</div>
              <h3>{isAdmin ? "Adipiscing elit" : "Päckchen importieren"}</h3>
              <p>
                {isAdmin
                  ? "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet."
                  : "Zu Beginn werden sogenannte „Päckchen“ importiert. Ein Päckchen bündelt thematisch zusammengehörige Fragen zu einem bestimmten Tätigkeits- oder Aufgabenbereich."}
              </p>
              <p>
                {isAdmin
                  ? "Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora torquent."
                  : "Das Importieren erfolgt pro Referat, Querschnittsreferat oder Stabsstelle. Einer Organisationseinheit sind Sie bereits durch Ihre Auswahl beim Login zugeordnet."}
              </p>
              <p>
                {isAdmin
                  ? "Per conubia nostra, per inceptos himenaeos. Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor."
                  : "Bitte importieren Sie alle Päckchen, die für Ihre Organisationseinheit relevant sind, wenn der beschriebene Tätigkeitsbereich bei Ihnen schwerpunktmäßig bearbeitet wird. Einzelne Berührungspunkte mit einem Tätigkeitsbereich müssen in der Regel nicht berücksichtigt werden. So bearbeiten Sie nur Fragen, die Ihre Arbeitsrealität abbilden."}
              </p>
              <p>
                {isAdmin
                  ? "Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor. Morbi lectus risus, iaculis vel, suscipit quis, luctus non, massa."
                  : "Sollten Sie beim Beantworten der Fragen feststellen, dass das gewählte Päckchen doch nicht Ihren Aufgabenbereichen entspricht, können Sie das Päckchen im Konfigurationsmodus aus Ihrer Auswahlliste löschen."}
              </p>
            </article>

            <article className="stepCard">
              <div className="stepNumber">2</div>
              <h3>{isAdmin ? "Sed cursus ante" : "Fragebogen bearbeiten"}</h3>
              <p>
                {isAdmin
                  ? "Fusce ac turpis quis ligula lacinia aliquet. Mauris ipsum. Nulla metus metus, ullamcorper vel, tincidunt sed, euismod in, nibh. Quisque volutpat condimentum velit."
                  : "Innerhalb eines Päckchens werden mehrere Fragen gestellt, die sich auf bereits etablierte Strukturen, Prozesse oder Maßnahmen in Ihrer Organisationseinheit beziehen."}
              </p>
              <p>
                {isAdmin
                  ? "Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam nec ante. Sed lacinia, urna non tincidunt mattis, tortor neque adipiscing diam."
                  : "Zu jeder Frage stehen fünf Antwortoptionen zur Verfügung. Gehen Sie in Ihrer Organisationseinheit in den Dialog miteinander und wählen Sie die Option, die den aktuellen Zustand in Ihrer Organisationseinheit am besten beschreibt. Im Fokus steht dabei die realistische Beschreibung, nicht die Bewertung dieses Zustands."}
              </p>
              <p>
                {isAdmin
                  ? "A cursus ipsum ante quis turpis. Nulla facilisi. Ut fringilla. Suspendisse potenti. Nunc feugiat mi a tellus consequat imperdiet. Vestibulum sapien. Proin quam. Etiam ultrices."
                  : "Die in den Antwortoptionen genannten Maßnahmen oder Tools dienen als Beispiele. Prüfen Sie, ob diese oder vergleichbare Maßnahmen oder Tools in Ihrer Organisationseinheit verwendet werden, um eine Antwortoption als zutreffend zu bewerten."}
              </p>
              <p>
                {isAdmin
                  ? "Suspendisse in justo eu magna luctus suscipit. Sed lectus. Integer euismod lacus luctus magna. Quisque cursus, metus vitae pharetra auctor, sem massa mattis sem, at interdum magna augue eget diam."
                  : "Passt eine Frage nicht zu Ihrer Arbeitsrealität, können Sie die Option „Keine Angabe“ wählen. Diese ist eine vollwertige Antwortoption, um irrelevante Fragen bei der Berechnung des Reifegrads nicht einzubeziehen."}
              </p>
              <p>
                {isAdmin
                  ? "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Morbi lacinia molestie dui. Praesent blandit dolor. Sed non quam. In vel mi sit amet augue congue elementum."
                  : "Die Bearbeitung des Fragebogens kann jederzeit unterbrochen und zu einem späteren Zeitpunkt fortgesetzt werden, eine Zwischenspeicherung der eingegebenen Daten erfolgt automatisch. Erst nach Abschluss eines Päckchens werden die Antworten in die Auswertung übernommen."}
              </p>
            </article>

            <article className="stepCard">
              <div className="stepNumber">3</div>
              <h3>{isAdmin ? "Nulla quis sem" : "Ergebnisse verstehen"}</h3>
              <p>
                {isAdmin
                  ? "Morbi in ipsum sit amet pede facilisis laoreet. Donec lacus nunc, viverra nec, blandit vel, egestas et, augue. Vestibulum tincidunt malesuada tellus. Ut ultrices ultrices enim."
                  : "Die Ergebnisse des Reifegradmodells werden grafisch als Balkendiagramm aufbereitet. Die importierten Päckchen sind farblich voneinander abgesetzt und bilden die übergeordneten Dimensionen, anhand derer Ihre Organisationseinheit bewertet wurde."}
              </p>
              <p>
                {isAdmin
                  ? "Curabitur sit amet mauris. Morbi in dui quis est pulvinar ullamcorper. Nulla facilisi. Integer lacinia sollicitudin massa. Cras metus. Sed aliquet risus a tortor."
                  : "Innerhalb jeder Dimension werden thematisch enger gefasste Bereiche unterschieden, die als Handlungsfelder bezeichnet werden. Der Ausschlag eines Balkens zeigt an, in welcher Reifegradstufe sich Ihre Organisationseinheit innerhalb eines Handlungsfeldes aktuell befindet."}
              </p>
              <p>
                {isAdmin
                  ? "Integer id quam. Morbi mi. Quisque nisl felis, venenatis tristique, dignissim in, ultrices sit amet, augue. Proin sodales libero eget ante. Nulla quam. Aenean laoreet."
                  : "Die Visualisierung ermöglicht einen schnellen Überblick über Stärken und Entwicklungsbedarfe in den jeweiligen Handlungsfeldern."}
              </p>
              <p>
                {isAdmin
                  ? "Vestibulum nisi lectus, commodo ac, facilisis ac, ultricies eu, pede. Ut orci risus, accumsan porttitor, cursus quis, aliquet eget, justo. Sed pretium blandit orci."
                  : "Ergänzend zu den Ergebnissen werden konkrete, kontextbezogene Handlungsempfehlungen ausgegeben. Diese zeigen auf, welche Maßnahmen geeignet sein können, um den nächsten Reifegrad zu erreichen und die digitale Barrierefreiheit innerhalb eines Handlungsfeldes zu verbessern."}
              </p>
            </article>
          </div>
        </section>

        <section className="noticeBlock" aria-labelledby="wichtiger-hinweis">
          <div className="noticeLabel">Wichtig</div>
          <div>
            <h2 id="wichtiger-hinweis">
              {isAdmin ? "Lorem ipsum dolor sit amet" : "Unterstützungs- und Entwicklungsinstrument"}
            </h2>
            <p>
              {isAdmin
                ? "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
                : "Das Reifegradmodell ist ausdrücklich als Unterstützungs- und Entwicklungsinstrument zu verstehen. Es soll Diskussionen anregen, Transparenz schaffen und als Grundlage für Planung, Priorisierung und Weiterentwicklung der digitalen Barrierefreiheit dienen – nicht als Kontroll- oder Bewertungsinstrument."}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HomePage;
