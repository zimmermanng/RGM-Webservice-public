import React from 'react';
import './DataTable.css';

const DataTable = ({ data }) => {
    return (
        <table aria-labelledby="data-table" role="table">
            <caption id="data-table" className="sr-only">Tabelle der Selbstauswertung Ergebnisse</caption>
            <thead>
                <tr>
                    <th scope="col">Dimension</th>
                    <th scope="col">Kategorie</th>
                    <th scope="col">Stufe</th>
                </tr>
            </thead>
            <tbody>
                {data.map((row, index) => (
                    <tr 
                        key={index} 
                        tabIndex={0} 
                        role="row" 
                        aria-label={`Dimension: ${row.group}, Kategorie: ${row.category}, Stufe: ${row.value - 1 === -1 ? 'Nicht bewertet' : row.value - 1}`}
                        className="focusable-row"
                    >
                        <td>{row.group}</td>
                        <td>{row.category}</td>
                        <td>
                            {row.value - 1 === -1 ? (
                                <span className="nicht-bewertet" aria-label="Nicht bewertet">Nicht bewertet</span>
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

