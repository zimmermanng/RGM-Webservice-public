import React, { useEffect, useMemo, useRef, useState } from "react";
import RadialBarChart from "../components/radialBarChart";
import { API_BASE } from "../config.ts";
import { useSearchParams } from "react-router-dom";
import useDialogFocus from "../hooks/useDialogFocus";
import { createZipBlob } from "../utils/zip";

const MATURITY_LEVELS = [1, 2, 3, 4];
const LEVEL_COLORS = {
  1: "#d92d20",
  2: "#f79009",
  3: "#12b76a",
  4: "#5e5f4f",
};

const calculationLabels = {
  average: "Mittelwerte",
  minimum: "Minimalwerte",
};

function AdminEvaluationOverallPage({ activeCompany = "LMZ" }) {
  const [calculationMode, setCalculationMode] = useState("average");
  const [selectedLevels, setSelectedLevels] = useState(new Set(MATURITY_LEVELS));
  const [selectedLevel0, setSelectedLevel0] = useState("");
  const [selectedLevel1, setSelectedLevel1] = useState("gesamt");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [exportBusy, setExportBusy] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [evaluationRound, setEvaluationRound] = useState({
    id: "",
    name: "",
    packages: [],
    organisation: [],
    leafResults: [],
  });
  const [loadingEvaluationRound, setLoadingEvaluationRound] = useState(true);
  const [errorLoading, setErrorLoading] = useState(false);
  const pageRef = useRef(null);
  const evaluationId = searchParams.get("id")

  useEffect(() => {  
    if (!evaluationId) {
      setLoadingEvaluationRound(false);
      return setErrorLoading(true);
    };
    const fetchEvaluationData = async () => {
      try {
        const res = await fetch(`${API_BASE}/evaluation/retrieve-data?id=${evaluationId}`, {
          credentials: "include",
        });
        const evalData = await res.json();
        if (evalData.ok) setEvaluationRound(evalData.data);
        else return setErrorLoading(true);
      } catch (err) {
        console.error("Fehler beim Laden der Evaluations Daten:", err);
      } finally {
        setLoadingEvaluationRound(false);
      }
    };
    fetchEvaluationData();
  }, [evaluationId]);

  const unitNameById = useMemo(
    () => buildUnitNameMap(evaluationRound.organisation),
    [evaluationRound.organisation]
  );
  const allLeafUnitIds = useMemo(
    () => getAllLeafUnitIds(evaluationRound.organisation),
    [evaluationRound.organisation]
  );
  const selectedUnitIds = useMemo(
    () =>
      getSelectedLeafUnitIds(
        evaluationRound.organisation,
        selectedLevel0,
        selectedLevel1
      ),
    [evaluationRound.organisation, selectedLevel0, selectedLevel1]
  );
  const level1Units = useMemo(() => {
    if (!selectedLevel0 || selectedLevel0 === "all") return [];
    return (
      evaluationRound.organisation.find((unit) => unit.id === selectedLevel0)
        ?.children || []
    );
  }, [evaluationRound.organisation, selectedLevel0]);

  const overallResults = useMemo(
    () =>
      calculatePackageResults({
        packages: evaluationRound.packages,
        leafResults: evaluationRound.leafResults,
        mode: calculationMode,
        unitNameById,
      }),
    [calculationMode, evaluationRound, unitNameById]
  );
  const organisationResults = useMemo(() => {
    const selectedResults = evaluationRound.leafResults.filter((result) =>
      selectedUnitIds.includes(result.unitId)
    );

    return calculatePackageResults({
      packages: evaluationRound.packages,
      leafResults: selectedResults,
      mode: calculationMode,
      unitNameById,
    });
  }, [calculationMode, evaluationRound, selectedUnitIds, unitNameById]);

  const contributingLeafCount = evaluationRound.leafResults.filter(
    (result) => result.completedPackageIds?.length > 0
  ).length;
  const contributingPercent = allLeafUnitIds.length
    ? Math.round((contributingLeafCount / allLeafUnitIds.length) * 100)
    : 0;

  const visibleOverallResults = filterBySelectedLevels(
    overallResults,
    selectedLevels
  );
  const visibleOrganisationResults = filterBySelectedLevels(
    organisationResults,
    selectedLevels
  );
  const hasOrganisationSelection = Boolean(selectedLevel0);

  const handleLevelToggle = (level) => {
    setSelectedLevels((previous) => {
      const next = new Set(previous);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const handleLevel0Change = (event) => {
    setSelectedLevel0(event.target.value);
    setSelectedLevel1("gesamt");
  };

  const downloadVisibleCharts = async () => {
    setExportBusy(true);
    setExportStatus("Die sichtbaren Ergebnisgrafiken werden erstellt …");

    try {
      const chartContainers = Array.from(
        pageRef.current?.querySelectorAll(".admin-overall-chart") || []
      ).filter((container) => container.querySelector("svg"));

      if (!chartContainers.length) {
        throw new Error("Aktuell ist kein Ergebnisdiagramm zum Herunterladen sichtbar.");
      }

      const files = [];
      for (let index = 0; index < chartContainers.length; index += 1) {
        const container = chartContainers[index];
        const heading =
          container.querySelector(".admin-overall-chart-heading h2, .admin-overall-chart-heading h3")
            ?.textContent?.trim() || `Ergebnisdiagramm ${index + 1}`;
        const svg = container.querySelector("svg").cloneNode(true);
        svg
          .querySelectorAll("#tooltip-group, #focus-ring, #focus-ring-inner")
          .forEach((node) => node.remove());
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        svg.removeAttribute("xmlns:xlink");
        await embedSvgImages(svg);
        files.push({
          name: `${String(index + 1).padStart(2, "0")}_${fileSlug(heading)}.svg`,
          content: new XMLSerializer().serializeToString(svg),
        });
      }

      downloadBlob(
        createZipBlob(files),
        `${fileSlug(evaluationRound.name)}_Gesamtauswertung.zip`
      );
      setExportStatus(
        `${files.length} sichtbare Ergebnisgrafik${files.length === 1 ? "" : "en"} wurde${files.length === 1 ? "" : "n"
        } heruntergeladen.`
      );
    } catch (error) {
      console.error("Fehler beim Exportieren der Ergebnisgrafiken:", error);
      setExportStatus(
        error.message || "Die Ergebnisgrafiken konnten nicht heruntergeladen werden."
      );
    } finally {
      setExportBusy(false);
    }
  };

  return (
    (loadingEvaluationRound ? (
      <div className="admin-overall-page">
        <section className="admin-overall-loading">
          <p className="access-subtitle" role="status" aria-live="polite">
            Evaluations Runde wird geladen …
          </p>
        </section>
      </div>
    ) : errorLoading ? (
      <div className="admin-overall-page">
        <section className="admin-overall-loading">
          <p className="access-error" role="alert">
            Die Evaluations Runde konnte nicht geladen werden. Bitte laden Sie die Seite
            erneut oder wenden Sie sich an die Administration.
          </p>
        </section>
      </div>
    ) : (
      <div className="admin-overall-page" ref={pageRef}>
        <section className="admin-overall-hero">
          <div className="page-width">
            <p className="sectionKicker">Evaluationsrunden</p>
            <h1>Gesamtauswertung</h1>
            <button
              type="button"
              className="homeButton"
              onClick={downloadVisibleCharts}
              disabled={exportBusy}
              aria-describedby="overall-chart-export-description"
            >
              {exportBusy ? "Grafiken werden erstellt …" : "Sichtbare Ergebnisgrafiken herunterladen"}
            </button>
            <p id="overall-chart-export-description" className="admin-overall-select-help">
              Lädt die aktuell auf dieser Seite erzeugten Diagramme gemeinsam als ZIP-Datei herunter.
            </p>
            {exportStatus && (
              <p
                id="overall-chart-export-status"
                className="evaluation-action-status"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {exportStatus}
              </p>
            )}
          </div>
        </section>

        <section className="admin-overall-section page-width">
          <div className="admin-overall-layout">
            <aside className="admin-overall-panel" aria-label="Filter Gesamtergebnis">
              <EvaluationToolbar
                calculationMode={calculationMode}
                selectedLevels={selectedLevels}
                onModeChange={setCalculationMode}
                onLevelToggle={handleLevelToggle}
              />
              <PackageDetailsButtons
                results={visibleOverallResults}
                onPackageClick={setSelectedPackage}
              />
              <p className="admin-overall-info" role="status">
                {contributingLeafCount} von {allLeafUnitIds.length} Einheiten auf
                Blattebene haben Ergebnisse beigesteuert ({contributingPercent} Prozent).
              </p>
            </aside>

            <PackageChart
              headingLevel={2}
              title={`Gesamtergebnis ${evaluationRound.name}`}
              subtitle={calculationLabels[calculationMode]}
              results={visibleOverallResults}
              emptyMessage="Für das Gesamtergebnis kann mit den aktuellen Filtern kein Diagramm erstellt werden."
              onPackageClick={setSelectedPackage}
              activeCompany={activeCompany}
              showDetailsHint
            />
          </div>
        </section>

        <section className="admin-overall-section page-width">
          <div className="admin-overall-section-heading">
            <h2>Ergebnisse der Organisationseinheiten</h2>
            <p>
              Wählen Sie eine Organisationseinheit, um die Werte für diesen
              Ausschnitt neu zu berechnen.
            </p>
          </div>

          <div className="admin-overall-layout admin-overall-layout-detail">
            <aside className="admin-overall-panel" aria-label="Filter Organisationseinheiten">
              <OrganisationSelectors
                organisation={evaluationRound.organisation}
                selectedLevel0={selectedLevel0}
                selectedLevel1={selectedLevel1}
                level1Units={level1Units}
                onLevel0Change={handleLevel0Change}
                onLevel1Change={setSelectedLevel1}
              />
            </aside>

            {hasOrganisationSelection ? (
              <PackageChart
                headingLevel={3}
                title="Auswertung der gewählten Organisationseinheit"
                subtitle={calculationLabels[calculationMode]}
                results={visibleOrganisationResults}
                emptyMessage="Für diese Organisationseinheit liegen keine vollständigen Ergebnisse vor."
                activeCompany={activeCompany}
                showDetailsHint={false}
              />
            ) : (
              <div className="admin-overall-placeholder" role="status">
                Wählen Sie zuerst eine Einheit auf Ebene 0 aus. Danach wird das
                passende Diagramm angezeigt.
              </div>
            )}
          </div>
        </section>

        {selectedPackage && (
          <PackageDetailsOverlay
            packageResult={selectedPackage}
            onClose={() => setSelectedPackage(null)}
          />
        )}
      </div>
    ))

  );
}

function EvaluationToolbar({
  calculationMode,
  selectedLevels,
  onModeChange,
  onLevelToggle,
}) {
  return (
    <div className="admin-overall-toolbar" aria-label="Auswertungsoptionen">
      <div
        className="admin-overall-toggle"
        role="group"
        aria-label="Berechnungsart"
        aria-describedby="calculation-mode-description"
      >
        <span id="calculation-mode-description" className="sr-only">
          Wählen Sie eine Berechnungsart. Der aktuell ausgewählte Button wird
          als gedrückt ausgegeben.
        </span>
        <button
          type="button"
          className={`toggle-button ${calculationMode === "average" ? "active" : ""}`}
          aria-pressed={calculationMode === "average"}
          onClick={() => onModeChange("average")}
        >
          Mittelwerte
        </button>
        <button
          type="button"
          className={`toggle-button ${calculationMode === "minimum" ? "active" : ""}`}
          aria-pressed={calculationMode === "minimum"}
          onClick={() => onModeChange("minimum")}
        >
          Minimalwerte
        </button>
      </div>

      <fieldset className="admin-overall-filter">
        <legend>Reifegradstufen</legend>
        {MATURITY_LEVELS.map((level) => (
          <label key={level} className="filter-option">
            <input
              type="checkbox"
              checked={selectedLevels.has(level)}
              onChange={() => onLevelToggle(level)}
            />
            Stufe {level}
          </label>
        ))}
      </fieldset>
    </div>
  );
}

function PackageDetailsButtons({ results, onPackageClick }) {
  if (!results.length) return null;

  return (
    <div className="admin-overall-detail-actions" aria-label="Päckchendetails öffnen">
      <h3>Details</h3>
      <p>Alternativ zum Diagramm können Sie die Details direkt öffnen.</p>
      <div className="admin-overall-detail-buttons">
        {results.map((result) => (
          <button
            key={result.id}
            type="button"
            className="admin-overall-detail-button"
            onClick={() => onPackageClick(result)}
          >
            <span>{result.name}</span>
            <strong>Stufe {result.displayLevel}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}
function OrganisationSelectors({
  organisation,
  selectedLevel0,
  selectedLevel1,
  level1Units,
  onLevel0Change,
  onLevel1Change,
}) {
  return (
    <div className="admin-overall-selectors">
      <label htmlFor="overall-parent-unit">
        Übergeordnete Organisationseinheit
        <select
          id="overall-parent-unit"
          value={selectedLevel0}
          onChange={onLevel0Change}
          aria-describedby="overall-parent-unit-help"
        >
          <option value="">Bitte auswählen</option>
          <option value="all">Gesamt</option>
          {organisation.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
        <span id="overall-parent-unit-help" className="admin-overall-select-help">
          Wählen Sie „Gesamt“ oder eine Organisationseinheit als Ausgangspunkt.
        </span>
      </label>

      <label htmlFor="overall-child-unit">
        Untergeordnete Organisationseinheit
        <select
          id="overall-child-unit"
          value={selectedLevel1}
          onChange={(event) => onLevel1Change(event.target.value)}
          disabled={!selectedLevel0 || selectedLevel0 === "all" || level1Units.length === 0}
          aria-describedby="overall-child-unit-help"
        >
          <option value="gesamt">Gesamt</option>
          {level1Units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
        <span id="overall-child-unit-help" className="admin-overall-select-help">
          {!selectedLevel0
            ? "Wählen Sie zuerst eine übergeordnete Organisationseinheit."
            : selectedLevel0 === "all"
              ? "Bei der Gesamtauswertung ist keine untergeordnete Auswahl erforderlich."
              : level1Units.length === 0
                ? "Für diese Organisationseinheit sind keine Untereinheiten vorhanden."
                : "Optional können Sie die Ergebnisse auf eine Untereinheit begrenzen."}
        </span>
      </label>
    </div>
  );
}

function PackageChart({
  headingLevel = 3,
  title,
  subtitle,
  results,
  emptyMessage,
  onPackageClick,
  activeCompany,
  showDetailsHint = true,
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const isInteractive = typeof onPackageClick === "function";

  if (!results.length) {
    return (
      <div className="admin-overall-empty" role="status">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="admin-overall-chart" aria-label={title}>
      <div className="admin-overall-chart-heading">
        <Heading>{title}</Heading>
        <span>{subtitle}</span>
      </div>

      {showDetailsHint && isInteractive && (
        <p className="admin-overall-chart-hint">
          Die Päckchen im Diagramm sind auswählbar. Wählen Sie ein Segment aus
          oder nutzen Sie die Detail-Schaltflächen im Filterbereich.
        </p>
      )}

      <RadialBarChart
        data={toChartRows(results, isInteractive)}
        activeCompany={activeCompany}
        ariaLabel={isInteractive
          ? `${title}. Interaktives Diagramm. Päckchen auswählen, um Details zu öffnen.`
          : `${title}. Diagramm der Päckchenergebnisse.`}
        showGroupRing={false}
        showCategoryLabels
        maxValue={4}
        numTicks={4}
        valueOffset={0}
        labelMaxChars={14}
        categoryFontSize={38}
        categoryLineHeight={44}
        labelRingThickness={120}
        onSegmentClick={isInteractive
          ? (entry) => onPackageClick(entry.source)
          : undefined}
      />
    </div>
  );
}

function PackageDetailsOverlay({ packageResult, onClose }) {
  const closeButtonRef = useRef(null);
  const dialogRef = useDialogFocus(true, {
    initialFocusRef: closeButtonRef,
    onClose,
  });

  return (
    <div className="session-timeout-dialog-backdrop" role="presentation">
      <div
        ref={dialogRef}
        className="admin-overall-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="package-detail-title"
        tabIndex={-1}
      >
        <h2 id="package-detail-title">{packageResult.name}</h2>

        <dl className="admin-overall-detail-list">
          <div>
            <dt>Bearbeitet</dt>
            <dd>{packageResult.contributors.length} mal</dd>
          </div>
          <div>
            <dt>Erreichte Stufe</dt>
            <dd>
              Stufe {packageResult.displayLevel} ({formatValue(packageResult.rawValue)})
            </dd>
          </div>
        </dl>

        <h3>Importeure</h3>
        <ul className="admin-overall-contributor-list">
          {packageResult.contributors.map((contributor) => (
            <li key={contributor.unitId}>
              <span>{contributor.unitName}</span>
              <strong>
                Stufe {contributor.displayLevel} ({formatValue(contributor.rawValue)})
              </strong>
              <small>{contributor.importer}</small>
            </li>
          ))}
        </ul>

        <div className="session-timeout-actions">
          <button ref={closeButtonRef} type="button" className="access-button" onClick={onClose}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}

function toChartRows(results, isInteractive = false) {
  return results.map((result) => ({
    group: "Päckchen",
    groupLabel: "Auswertung",
    category: result.name,
    categoryLabel: "Päckchen",
    value: result.displayLevel,
    displayValue: result.displayLevel,
    color: LEVEL_COLORS[result.displayLevel],
    source: result,
    ariaLabel: `${result.name}, Stufe ${result.displayLevel}, Rohwert ${formatValue(result.rawValue)}${isInteractive ? ", Details öffnen" : ""}`,
  }));
}

function calculatePackageResults({ packages, leafResults, mode, unitNameById }) {
  return packages
    .map((pkg) => {
      const contributors = leafResults
        .map((result) => {
          const rawValue = getLeafPackageValue(result, pkg);
          if (rawValue == null) return null;

          return {
            unitId: result.unitId,
            unitName: unitNameById[result.unitId] || result.unitId,
            importer: result.importer,
            rawValue,
            displayLevel: roundDisplayLevel(rawValue),
          };
        })
        .filter(Boolean);

      if (!contributors.length) return null;

      const rawValue =
        mode === "minimum"
          ? Math.min(...contributors.map((entry) => entry.rawValue))
          : average(contributors.map((entry) => entry.rawValue));

      return {
        id: pkg.id,
        name: pkg.name,
        rawValue,
        displayLevel: roundDisplayLevel(rawValue),
        contributors,
      };
    })
    .filter(Boolean);
}

function getLeafPackageValue(result, pkg) {
  const packageValues = result.values?.[pkg.id];
  if (!packageValues || !result.completedPackageIds?.includes(pkg.id)) {
    return null;
  }

  const fieldValues = Object.values(packageValues)
    .filter(Number.isFinite)
    // Fragebogenergebnisse verwenden 0 für "nicht bewertet" und speichern
    // bewertete Reifegrade für das Diagramm um eins verschoben (1..5).
    // Für Mittelwerte müssen die ursprünglichen Stufen (0..4) verwendet werden.
    .filter((value) => value > 0)
    .map((value) => value - 1);
  return fieldValues.length ? average(fieldValues) : null;
}

function filterBySelectedLevels(results, selectedLevels) {
  return results.filter((entry) => selectedLevels.has(entry.displayLevel));
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundDisplayLevel(value) {
  return Math.max(1, Math.min(4, Math.floor(value + 0.5)));
}

function formatValue(value) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(2).replace(".", ",");
}

async function embedSvgImages(svg) {
  const images = Array.from(svg.querySelectorAll("image"));
  await Promise.all(
    images.map(async (image) => {
      const href =
        image.getAttribute("href") ||
        image.getAttributeNS("http://www.w3.org/1999/xlink", "href");
      if (!href) return;

      image.removeAttributeNS("http://www.w3.org/1999/xlink", "href");
      image.removeAttribute("xlink:href");
      image.setAttribute("href", href);
      if (href.startsWith("data:")) return;

      try {
        const response = await fetch(href);
        if (!response.ok) return;
        const dataUrl = await blobToDataUrl(await response.blob());
        image.setAttribute("href", dataUrl);
      } catch {
        // Das Diagramm bleibt auch ohne eingebettetes Logo vollständig lesbar.
      }
    })
  );
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function fileSlug(value) {
  return Array.from(String(value || "Gesamtauswertung"))
    .filter((character) => character.charCodeAt(0) >= 32)
    .join("")
    .trim()
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getAllLeafUnitIds(organisation) {
  return organisation.flatMap((unit) =>
    unit.children?.length ? unit.children.map((child) => child.id) : [unit.id]
  );
}

function getSelectedLeafUnitIds(organisation, level0Id, level1Id) {
  if (!level0Id) return [];

  if (level0Id === "all") {
    return getAllLeafUnitIds(organisation);
  }

  const level0 = organisation.find((unit) => unit.id === level0Id);
  if (!level0) return [];

  if (!level0.children?.length) {
    return [level0.id];
  }

  if (level1Id !== "gesamt") {
    return [level1Id];
  }

  return level0.children.map((child) => child.id);
}

function buildUnitNameMap(organisation) {
  return organisation.reduce((acc, unit) => {
    acc[unit.id] = unit.name;
    unit.children?.forEach((child) => {
      acc[child.id] = child.name;
    });
    return acc;
  }, {});
}

export default AdminEvaluationOverallPage;
