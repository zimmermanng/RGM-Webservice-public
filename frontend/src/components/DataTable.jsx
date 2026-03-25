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
        {data.map((row, index) => (
          <tr key={index}>
            <td>{row.group}</td>
            <td>{row.category}</td>
            <td>
              {row.value - 1 === -1 ? (
                <span className="nicht-bewertet">Nicht bewertet</span>
              ) : (
                row.value - 1
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DataTable;