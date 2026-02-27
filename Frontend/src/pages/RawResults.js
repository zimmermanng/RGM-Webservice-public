import React, { useEffect, useState } from "react";

const RawResults = () => {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/session/results`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`Server antwortete mit Status ${res.status}`);
        }

        const data = await res.json();
        setResults(data.results);

      } catch (err) {
        console.error("Fehler beim Laden der Session-Daten:", err);
        alert("Backend nicht erreichbar oder Fehler beim Laden der Daten");
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
