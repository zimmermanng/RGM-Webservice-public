/**
 * Accessible table view for Shuffle result rows.
 * It mirrors the chart data in a semantic table so users can inspect each
 * dimension, category, and displayed stufe without relying on the SVG chart.
 */
import React from "react";

const DataTable = ({ data }) => {
  return (
    <table aria-labelledby="data-table">
      <caption id="data-table" className="sr-only">
        Tabelle der Selbstauswertung Ergebnisse
      </caption>
      <thead>
        <tr>
          <th scope="col">Dimension</th>
          <th scope="col">Kategorie</th>
          <th scope="col">Stufe</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => {
          const displayedStufe = row.value - 1;

          return (
            <tr key={`${row.group}-${row.category}-${index}`}>
              <td>{row.group}</td>
              <td>{row.category}</td>
              <td>
                {displayedStufe === -1 ? (
                  <span className="nicht-bewertet">
                    Nicht bewertet
                  </span>
                ) : (
                  displayedStufe
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default DataTable;