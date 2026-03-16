import React, { useState, useEffect, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import NavBar from "./components/NavBar/navBar";
import Footer from "./components/Footer/footer";

import UploadPage from "./pages/UploadPage";
import ResultPage from "./pages/ResultPage";
import Download from "./pages/DownloadPage";
import QuestionnairePage from "./pages/QuestionnairePage";
import DimensionsPage from "./pages/DimensionsPage";
import HomePage from "./pages/HomePage";
import ShuffleHomePage from "./pages/shuffleHomePage";
import RawResults from "./pages/RawResults";
import DimensionsEditPage from "./pages/DimensionsEditPage";

import { applyTheme } from "./theme";
import "./App.css";

const App = () => {
  const [data, setData] = useState([]);

  const activeCompany = "LMZ"; // "LMZ" oder "Shuffle"

  useEffect(() => {
    applyTheme(activeCompany);
  }, [activeCompany]);

  const homeElement = useMemo(() => {
    return activeCompany === "LMZ" ? (
      <HomePage activeCompany={activeCompany} />
    ) : (
      <ShuffleHomePage activeCompany={activeCompany} />
    );
  }, [activeCompany]);

  return (
    <Router>
      <NavBar activeCompany={activeCompany} />

      <main>
        <Routes>
          <Route path="/" element={homeElement} />

          <Route path="/download" element={<Download />} />
          <Route path="/upload" element={<UploadPage onUpload={setData} />} />

          <Route
            path="/dimensions"
            element={<DimensionsPage activeCompany={activeCompany} />}
          />
          <Route
            path="/dimensions/bearbeiten"
            element={<DimensionsEditPage activeCompany={activeCompany} />}
          />

          <Route
            path="/questionnaire"
            element={<QuestionnairePage activeCompany={activeCompany} />}
          />
          <Route
            path="/questionnaire/:dimensionId/:handlungsfeldId"
            element={<QuestionnairePage activeCompany={activeCompany} />}
          />

          <Route
            path="/results"
            element={<ResultPage data={data} activeCompany={activeCompany} />}
          />
          <Route
            path="/rawresults"
            element={<RawResults data={data} activeCompany={activeCompany} />}
          />
          <Route
            path="/handlungsempfehlungen"
            element={<ResultPage data={data} activeCompany={activeCompany} />}
          />
        </Routes>
      </main>

      {/* Für die Pilotphase ausgeblendet */}
      {/* <Footer /> */}
    </Router>
  );
};

export default App;