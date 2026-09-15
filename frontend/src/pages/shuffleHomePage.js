import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="homeContainer">
      <section className="heroSection">
        <img
          src="/shuffle-logo.svg"
          alt="Shuffle Logo"
          className="heroLogo"
        />

        <h1 className="heroTitle">Shuffle RGM-Prüfwerkzeug</h1>

        <p className="heroSubtitle">
          Prüfwerkzeug zur Selbstbewertung des Refegrads Ihrer Hochschule. Über den folgenden Button erreichen Sie direkt einen Fragebogen, welcher der Selbstbewertung dienen kann. Alternativ können Sie über die Downloads eine Bewertungsmatrix laden.
        </p>

        <Link to="/dimensions" className="homeButton">
          Direkt zum Fragebogen
        </Link>
      </section>

      <section className="contentRow">
        <div className="bottomLeftText">
          <h2>Willkommen!</h2>
          <p>
            In SHUFFLE werden Maßnahmen auf technischer, struktureller und didaktischer Ebene zur Verbesserung von digitaler Barrierefreiheit an Hochschulen entwickelt, erprobt und dauerhaft als Open-Source-Lösungen bereitgestellt. Damit setzt SHUFFLE an den Forderungen des Hochschulrahmengesetzes an, eine chancengerechte digitale Teilhabe für alle Studierenden zu gewährleisten.
            <br/>
            Wir beziehen Lehrende und Studierende in die Entwicklungen ein. Ebenso arbeiten wir nach dem Universal Design for Learning (UDL) Ansatz, um allen Studierenden zugängliche Lernmaterialien und -umgebungen zu bieten.
            <br/>
            Dieses Werkzeug unterstützt Hochschulen dabei,
            ihren Reifegrad systematisch zu erfassen
            und sich gezielt weiterzuentwickeln.
            <br/>
            Durch die Beantwortung der Fragen in den
            unterschiedlichen Dimensionen entsteht ein
            individuelles Profil, das als Grundlage für
            strategische Entwicklungsprozesse dient.
          </p>
        </div>

        <div className="bottomRightInfo">
          <h3>Projektinformationen</h3>

          <dl className="infoList">
            <dt>Entwickelt:</dt>
            <dd>2021–2025</dd>

            <dt>Gefördert von:</dt>
            <dd>Stiftung Innovation in der Hochschullehre</dd>

            <dt>Projektpartner:</dt>
            <dd>Hochschule der Medien Stuttgart</dd>
            <dd>Universität Bielefeld</dd>
            <dd>Pädagogische Hochschule Heidelberg</dd>
            <dd>Pädagogische Hochschule Freiburg</dd>
          </dl>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
