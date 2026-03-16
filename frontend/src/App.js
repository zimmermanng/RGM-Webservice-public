import React, { useState, useEffect, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar/navBar";
import UploadPage from "./pages/UploadPage";
import Footer from "./components/Footer/footer";
import "./App.css";
import ResultPage from "./pages/ResultPage";
import Download from "./pages/DownloadPage";
import QuestionnairePage from "./pages/QuestionnairePage";
import DimensionsPage from "./pages/DimensionsPage";
import { applyTheme } from "./theme";
import HomePage from "./pages/HomePage";
import ShuffleHomePage from "./pages/shuffleHomePage";
import RawResults from "./pages/RawResults";
import DimensionsEditPage from "./pages/DimensionsEditPage";

const App = () => {
  const [data, setData] = useState([]);

  const activeCompany = "LMZ"; // "Shuffle" oder "LMZ"

  useEffect(() => {
    applyTheme(activeCompany);

    document.body.setAttribute("data-company", activeCompany);

    const root = document.getElementById("root");
    if (root) {
      root.setAttribute("data-company", activeCompany);
    }

    return () => {
      document.body.removeAttribute("data-company");

      if (root) {
        root.removeAttribute("data-company");
      }
    };
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
            element={<DimensionsEditPage />}
          />
          <Route path="/questionnaire" element={<QuestionnairePage />} />
          <Route
            path="/questionnaire/:dimensionId/:handlungsfeldId"
            element={<QuestionnairePage />}
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

      {/* <Footer /> */}
    </Router>
  );
};

export default App;