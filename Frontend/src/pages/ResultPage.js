import React, { useState } from "react";
import RadialBarChart from "../components/radialBarChart";
import DataTable from "../components/DataTable";
import "./ResultPage.css";

const ResultPage = ({ data }) => {
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
    <div>
      <div className="mainContainer" id="top">
        <h1>Ergebnisse</h1>
        <p>Hier finden Sie eine detaillierte Erklärung der Dimensionen und ihrer Stufen.</p>

        <div className="toggle-container">
          <button
            className={`toggle-button ${viewMode === "chart" ? "active" : ""}`}
            onClick={() => setViewMode("chart")}
          >
            Diagramm anzeigen
          </button>
          <button
            className={`toggle-button ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
          >
            Tabelle anzeigen
          </button>
        </div>
      </div>

      {/* Skip link */}
      <a href="#ext" className="skip-link">
        Diagramm und Tabelle überspringen
      </a>

      <div>
        {viewMode === "chart" ? (
          <div className="chart-container">
            <RadialBarChart data={data} />
          </div>
        ) : (
          <div className="table-container">
            <DataTable data={data} />
          </div>
        )}
      </div>

      <div id="ext">
        <h2>Erläuterungen</h2>
        <div className="tabs-container" id="ext">
          {Object.keys(dimensionData).map((dimension) => (
            <button
              key={dimension}
              className={`tab-button ${selectedTab === dimension ? "active" : ""}`}
              onClick={() => setSelectedTab(dimension)}
            >
              {dimension}
            </button>
          ))}

          {/* Filter button */}
          <button
            className="filter-toggle-button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            Filter
          </button>
        </div>

        {isFilterOpen && (
          <div className="filter-container">
            <div className="filter-options">
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
            </div>
          </div>
        )}
      </div>

      {/* Content per selected dimension, using ONLY row-level recommendations */}
      {selectedTab && (
        <div className="tab-content">
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
        </div>
      )}
    </div>
  );
};

export default ResultPage;
