import React, { useEffect, useState } from "react";

const RawResults = () => {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch("/api/session/results", {
          credentials: "include",
        });
        const data = await res.json();
        setResults(data.results);
      } catch (err) {
        console.error("Fehler beim Laden der Session-Daten:", err);
      }
    };

    fetchResults();
  }, []);

  return (
    <div>
      <h2>Ergebnisse</h2>
      {results.length === 0 ? (
        <p>Keine Ergebnisse vorhanden</p>
      ) : (
        results.map((item, index) => (
          <div key={index}>
            <p>
              <strong>Timestamp:</strong> {item.timestamp}
            </p>
            <pre>{JSON.stringify(item.data, null, 2)}</pre>
          </div>
        ))
      )}
    </div>
  );
};
export default RawResults;
