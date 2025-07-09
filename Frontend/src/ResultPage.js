import React, {useState} from "react";
import RadialBarChart from "./components/radialBarChart";
import DataTable from "./components/DataTable";
import PDFExport from "./components/PDFExport";
import { PDFDownloadLink } from "@react-pdf/renderer";
import "./ResultPage.css";
import handlungsempfehlungenData from "../src/components/data/handlungsempfehlungen.json";

const normalizeHandlungsempfehlungen = (data) => {
    return Object.keys(data).reduce((acc, category) => {
        acc[category] = Object.keys(data[category]).reduce((subAcc, stufe) => {
            subAcc[Number(stufe)] = data[category][stufe];
            return subAcc;
        }, {});
        return acc;
    }, {});
};

const normalizedHandlungsempfehlungen = normalizeHandlungsempfehlungen(handlungsempfehlungenData);

const ResultPage = ({ data }) => {
    const [viewMode, setViewMode] = useState("chart");
    const [selectedTab, setSelectedTab] = useState(null);
    const [visibleLevels, setVisibleLevels] = useState(new Set([0, 1, 2, 3, 4]));
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    if (data.length === 0) {
        return (
            <div className='mainContainer' id="top">
                <h1>Fehler: Ergebnisse</h1>
                <p>Keine Daten gefunden, bitte laden Sie eine geeignete Datei hoch.</p>
            </div>
        );
    }

    const dimensionData = data.reduce((acc, row) => {
        if (!acc[row.group]) acc[row.group] = {};
        acc[row.group][row.category] = row.value;
        return acc;
    }, {});

    const handleCheckboxChange = (level) => {
        setVisibleLevels((prevLevels) => {
            const newLevels = new Set(prevLevels);
            if (newLevels.has(level)) {
                newLevels.delete(level);
            } else {
                newLevels.add(level);
            }
            return newLevels;
        });
    };

    return (
        <div>
            <div className='mainContainer' id="top">
                <h1>Ergebnisse</h1>
                <p>Hier finden Sie eine detaillierte Erklärung der Dimensionen und ihrer Stufen.</p>
                {/* PDF Export Button */}
                <PDFDownloadLink document={<PDFExport />} fileName="dummy.pdf">
                    {({ loading }) => (
                        <button className="pdf-button">
                            {loading ? "Laden..." : "PDF herunterladen"}
                        </button>
                    )}
                </PDFDownloadLink>


                <div className="toggle-container">
                    <button className={`toggle-button ${viewMode === "chart" ? "active" : ""}`} onClick={() => setViewMode("chart")}>
                        Diagramm anzeigen
                    </button>
                    <button className={`toggle-button ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")}>
                        Tabelle anzeigen
                    </button>
                </div>
            </div>
            {/* Skip link */}
            <a href="#ext" className="skip-link">Diagramm und Tabelle überspringen</a>
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
                        <button key={dimension} className={`tab-button ${selectedTab === dimension ? "active" : ""}`} onClick={() => setSelectedTab(dimension)}>
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
                            {[...Array(5).keys()].map(level => (
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
                <div className="tab-content">
                    <h3>{selectedTab}</h3>
                    {Object.entries(dimensionData[selectedTab]).map(([category, stufe]) => {
                        let displayedStufe = stufe - 1;
                        let stufeKey = displayedStufe === -1 ? -1 : displayedStufe;
                        let handlungsempfehlung =
                            normalizedHandlungsempfehlungen[category]?.[stufeKey] ?? "Keine Handlungsempfehlung verfügbar.";

                        if (!visibleLevels.has(stufeKey)) return null;


                        return (
                            <div key={category} className="category-box">
                                <h4>{category}</h4>
                                <p><strong>Erreichte Stufe:</strong> {displayedStufe === -1 ? "Nicht bewertet" : displayedStufe}</p>
                                <h5>Handlungsempfehlung:</h5>
                                <p>{handlungsempfehlung}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ResultPage;

