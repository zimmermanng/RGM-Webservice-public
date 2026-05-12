import React, { useState } from "react";
import RadialBarChart from "../components/radialBarChart";
import DataTable from "../components/DataTable";

const ResultPage = ({ data, activeCompany}) => {
  const [viewMode, setViewMode] = useState("chart");
  const [selectedTab, setSelectedTab] = useState(null);
  const [visibleLevels, setVisibleLevels] = useState(new Set([0, 1, 2, 3, 4]));
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="mainContainer" id="top">
        <h1>Fehler: Ergebnisse</h1>
        <p>Keine Daten gefunden, bitte laden Sie eine geeignete Datei hoch.</p>
      </div>
    );
  }

  // For tabs: collect categories per dimension (unchanged behavior)
  const dimensionData = data.reduce((acc, row) => {
    if (!acc[row.group]) acc[row.group] = {};
    acc[row.group][row.category] = row.value;
    return acc;
  }, {});

  const handleCheckboxChange = (level) => {
    setVisibleLevels((prevLevels) => {
      const next = new Set(prevLevels);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const chartPanelId = "uploaded-results-chart-panel";
  const tablePanelId = "uploaded-results-table-panel";
  const filterPanelId = "uploaded-results-filter-panel";

  // --- helper: render mixed recommendations with nested bullets ---
  // Top-level bullets: lines starting with "." or "·"
  // Sub-bullets: lines starting with optional quote then "o", e.g.  o ...  or  "o ...
  // Everything else becomes a paragraph (<p>).
  const renderMixedRecommendations = (recs) => {
    const isTopBullet = (s) => /^\s*[.\u00B7]\s+/.test(s);
    const isSubBullet = (s) => /^\s*["“”']?\s*o\b\s*/i.test(s); // handles: o ..., "o ...
    const stripTopMarker = (s) => s.replace(/^\s*[.\u00B7]\s+/, "").trim();
    const stripSubMarker = (s) => s.replace(/^\s*["“”']?\s*o\b\s*/, "").trim();

    const blocks = [];
    let currentList = []; // [{ text: string, children: string[] }]
    let lastItem = null;

    const flushList = () => {
      if (currentList.length === 0) return;
      blocks.push(
        <ul key={`ul-${blocks.length}`}>
          {currentList.map((item, idx) => (
            <li key={idx}>
              {item.text}
              {item.children && item.children.length > 0 && (
                <ul>
                  {item.children.map((child, j) => (
                    <li key={j}>{child}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      );
      currentList = [];
      lastItem = null;
    };

    recs.forEach((line, i) => {
      const text = String(line ?? "").trim();
      if (!text) return;

      if (isTopBullet(text)) {
        const topText = stripTopMarker(text);
        const item = { text: topText, children: [] };
        currentList.push(item);
        lastItem = item;
        return;
      }

      if (isSubBullet(text)) {
        const subText = stripSubMarker(text);
        if (lastItem) {
          lastItem.children.push(subText);
        } else {
          // no parent bullet yet → treat as paragraph
          flushList();
          blocks.push(<p key={`p-${i}`}>{subText}</p>);
        }
        return;
      }

      // Plain paragraph: close any open list first
      flushList();
      blocks.push(<p key={`p-${i}`}>{text}</p>);
    });

    flushList();
    return blocks.length ? blocks : <p>Keine Handlungsempfehlungen geladen</p>;
  };
  // --- end helper ---

  return (
    <main className="results-page">
      <div className="mainContainer results-hero" id="top">
        <h1>Ergebnisse</h1>
        <p>Hier finden Sie eine detaillierte Erklärung der Dimensionen und ihrer Stufen.</p>

        <div className="toggle-container" role="group" aria-label="Darstellung auswählen">
          <button
            type="button"
            className={`toggle-button ${viewMode === "chart" ? "active" : ""}`}
            onClick={() => setViewMode("chart")}
            aria-pressed={viewMode === "chart"}
            aria-controls={chartPanelId}
          >
            Diagramm anzeigen
          </button>
          <button
            type="button"
            className={`toggle-button ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            aria-pressed={viewMode === "table"}
            aria-controls={tablePanelId}
          >
            Tabelle anzeigen
          </button>
        </div>
      </div>

      {/* Skip link */}
      <a href="#ext" className="skip-link">
        Diagramm und Tabelle überspringen
      </a>

      <section className="results-visual-section" aria-live="polite" aria-relevant="additions text">
        {viewMode === "chart" ? (
          <div
            id={chartPanelId}
            className="chart-container"
            role="region"
            aria-label="Diagramm"
          >
            <RadialBarChart data={data} activeCompany={activeCompany}/>
          </div>
        ) : (
          <div
            id={tablePanelId}
            className="table-container"
            role="region"
            aria-label="Tabelle"
          >
            <DataTable data={data} />
          </div>
        )}
      </section>

      <div id="ext">
        <h2>Erläuterungen</h2>
        <div className="tabs-container" role="group" aria-label="Dimension auswählen">
          {Object.keys(dimensionData).map((dimension) => (
            <button
              key={dimension}
              type="button"
              className={`tab-button ${selectedTab === dimension ? "active" : ""}`}
              onClick={() => setSelectedTab(dimension)}
              aria-pressed={selectedTab === dimension}
            >
              {dimension}
            </button>
          ))}

          {/* Filter button */}
          <button
            type="button"
            className="filter-toggle-button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-expanded={isFilterOpen}
            aria-controls={filterPanelId}
          >
            Filter
          </button>
        </div>

        {isFilterOpen && (
          <div className="filter-container" id={filterPanelId}>
            <fieldset className="filter-options">
              <legend className="sr-only">Stufen filtern</legend>
              {[...Array(5).keys()].map((level) => (
                <label key={level} className="filter-option">
                  <input
                    type="checkbox"
                    checked={visibleLevels.has(level)}
                    onChange={() => handleCheckboxChange(level)}
                  />
                  Stufe {level}
                </label>
              ))}
            </fieldset>
          </div>
        )}
      </div>

      {/* Content per selected dimension, using ONLY row-level recommendations */}
      {selectedTab && (
        <section className="tab-content" aria-live="polite">
          <h3>{selectedTab}</h3>
          {data
            .filter((row) => row.group === selectedTab)
            .map((row, idx) => {
              const displayedStufe = row.value - 1;
              const stufeKey = displayedStufe === -1 ? -1 : displayedStufe;
              if (!visibleLevels.has(stufeKey)) return null;

              const recs = Array.isArray(row.recommendations) ? row.recommendations : [];

              return (
                <div key={`${row.category}-${idx}`} className="category-box">
                  <h4>{row.category}</h4>
                  <p>
                    <strong>Erreichte Stufe:</strong>{" "}
                    {displayedStufe === -1 ? "Nicht bewertet" : displayedStufe}
                  </p>
                  <h5>Handlungsempfehlungen:</h5>
                  {recs.length > 0 ? (
                    renderMixedRecommendations(recs)
                  ) : (
                    <p>Keine Handlungsempfehlungen geladen</p>
                  )}
                </div>
              );
            })}
        </section>
      )}
    </main>
  );
};

export default ResultPage;
