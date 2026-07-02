import React, { useEffect, useMemo, useRef, useState } from "react";
import RadialBarChart from "../components/radialBarChart";
import DataTable from "../components/DataTable";

const CHART_ITEM_LIMIT = 18;

const ResultPage = ({ data, activeCompany }) => {
  const [viewMode, setViewMode] = useState("chart");
  const [selectedTab, setSelectedTab] = useState(null);
  const [visibleLevels, setVisibleLevels] = useState(new Set([0, 1, 2, 3, 4]));
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const tabRefs = useRef({});

  const safeData = Array.isArray(data) ? data : [];
  const chartItemLimitExceeded = safeData.length > CHART_ITEM_LIMIT;
  const activeViewMode = chartItemLimitExceeded ? "table" : viewMode;

  const dimensionData = useMemo(() => {
    return safeData.reduce((acc, row) => {
      if (!row?.group || !row?.category) return acc;
      if (!acc[row.group]) acc[row.group] = {};
      acc[row.group][row.category] = row.value;
      return acc;
    }, {});
  }, [safeData]);

  const dimensionKeys = useMemo(() => Object.keys(dimensionData), [dimensionData]);

  useEffect(() => {
    if (chartItemLimitExceeded && viewMode !== "table") {
      setViewMode("table");
    }
  }, [chartItemLimitExceeded, viewMode]);

  useEffect(() => {
    if (!dimensionKeys.length) {
      setSelectedTab(null);
      return;
    }

    if (!selectedTab || !dimensionKeys.includes(selectedTab)) {
      setSelectedTab(dimensionKeys[0]);
    }
  }, [dimensionKeys, selectedTab]);

  const handleCheckboxChange = (level) => {
    setVisibleLevels((prevLevels) => {
      const next = new Set(prevLevels);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const focusTab = (dimension) => {
    const tab = tabRefs.current[dimension];
    if (tab) tab.focus();
  };

  const handleTabKeyDown = (event, currentDimension) => {
    const currentIndex = dimensionKeys.indexOf(currentDimension);
    if (currentIndex === -1) return;

    let nextIndex = null;

    switch (event.key) {
      case "ArrowRight":
      case "Right":
        nextIndex = (currentIndex + 1) % dimensionKeys.length;
        break;
      case "ArrowLeft":
      case "Left":
        nextIndex = (currentIndex - 1 + dimensionKeys.length) % dimensionKeys.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = dimensionKeys.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextDimension = dimensionKeys[nextIndex];
    setSelectedTab(nextDimension);
    focusTab(nextDimension);
  };

  const renderMixedRecommendations = (recs) => {
    const isTopBullet = (s) => /^\s*[.\u00B7]\s+/.test(s);
    const isSubBullet = (s) => /^\s*["“”']?\s*o\b\s*/i.test(s);
    const stripTopMarker = (s) => s.replace(/^\s*[.\u00B7]\s+/, "").trim();
    const stripSubMarker = (s) => s.replace(/^\s*["“”']?\s*o\b\s*/, "").trim();

    const blocks = [];
    let currentList = [];
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
          flushList();
          blocks.push(<p key={`p-${i}`}>{subText}</p>);
        }
        return;
      }

      flushList();
      blocks.push(<p key={`p-${i}`}>{text}</p>);
    });

    flushList();
    return blocks.length ? blocks : <p>Keine Handlungsempfehlungen geladen</p>;
  };

  if (!safeData.length) {
    return (
      <div className="mainContainer" id="top">
        <h1>Fehler: Ergebnisse</h1>
        <p>Keine Daten gefunden, bitte laden Sie eine geeignete Datei hoch.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mainContainer" id="top">
        <h1>Ergebnisse</h1>
        <p>Hier finden Sie eine detaillierte Erklärung der Dimensionen und ihrer Stufen.</p>

        <div className="toggle-container">
          <button
            className={`toggle-button ${activeViewMode === "chart" ? "active" : ""}`}
            onClick={() => setViewMode("chart")}
            disabled={chartItemLimitExceeded}
            aria-disabled={chartItemLimitExceeded ? "true" : undefined}
          >
            Diagramm anzeigen
          </button>
          <button
            className={`toggle-button ${activeViewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
          >
            Tabelle anzeigen
          </button>
        </div>
      </div>

      <a href="#ext" className="skip-link">
        Diagramm und Tabelle überspringen
      </a>

      <div>
        {chartItemLimitExceeded && (
          <p className="chart-limit-notice" role="status">
            Für {safeData.length} Päckchen ist das Diagramm nicht mehr übersichtlich.
            Die Ergebnisse werden deshalb als Tabelle angezeigt.
          </p>
        )}
        {activeViewMode === "chart" ? (
          <div className="chart-container">
            <RadialBarChart data={safeData} activeCompany={activeCompany} />
          </div>
        ) : (
          <div className="table-container">
            <DataTable data={safeData} />
          </div>
        )}
      </div>

      <div id="ext">
        <h2>Erläuterungen</h2>

        <div className="tabs-container">
          <div className="tabs-list" role="tablist" aria-label="Dimensionen">
            {dimensionKeys.map((dimension) => {
              const isSelected = selectedTab === dimension;
              const slug = slugifyId(dimension);
              const tabId = `dimension-tab-${slug}`;
              const panelId = `dimension-panel-${slug}`;

              return (
                <button
                  key={dimension}
                  id={tabId}
                  ref={(node) => {
                    tabRefs.current[dimension] = node;
                  }}
                  role="tab"
                  type="button"
                  className={`tab-button ${isSelected ? "active" : ""}`}
                  aria-selected={isSelected ? "true" : "false"}
                  aria-controls={panelId}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setSelectedTab(dimension)}
                  onKeyDown={(event) => handleTabKeyDown(event, dimension)}
                >
                  {dimension}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="filter-toggle-button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            aria-expanded={isFilterOpen ? "true" : "false"}
            aria-controls="dimension-filter-panel"
          >
            Filter
          </button>
        </div>

        {isFilterOpen && (
          <div id="dimension-filter-panel" className="filter-container">
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

      {selectedTab && (
        <div
          id={`dimension-panel-${slugifyId(selectedTab)}`}
          className="tab-content"
          role="tabpanel"
          aria-labelledby={`dimension-tab-${slugifyId(selectedTab)}`}
        >
          <h3>{selectedTab}</h3>
          {safeData
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

function slugifyId(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

export default ResultPage;