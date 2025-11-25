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

const App = () => {
  const [data, setData] = useState([]);

const activeCompany = "LMZ"; // <-- hier umstellen, um das Design zu wechseln ("Shuffle" oder "LMZ")

  useEffect(() => {
    applyTheme(activeCompany);
  }, [activeCompany]);

  // Decide which homepage to render
  const homeElement = useMemo(() => {
    return activeCompany === "Shuffle" ? (
      <ShuffleHomePage activeCompany={activeCompany} />
    ) : (
      <HomePage activeCompany={activeCompany} />
    );
  }, [activeCompany]);

  return (
    <Router>
      <NavBar activeCompany={activeCompany} />
      <main>
        <Routes>
          {/* Single home route, decided by activeCompany */}
          <Route path="/" element={homeElement} />

          <Route path="/download" element={<Download />} />
          <Route path="/upload" element={<UploadPage onUpload={setData} />} />
          <Route path="/dimensions" element={<DimensionsPage activeCompany={activeCompany} />} />

          <Route path="/questionnaire" element={<QuestionnairePage />} />
          <Route path="/questionnaire/:dimensionId" element={<QuestionnairePage />} />

          <Route
            path="/results"
            element={<ResultPage data={data} activeCompany={activeCompany} />}
          />
          <Route
            path="/handlungsempfehlungen"
            element={<ResultPage data={data} activeCompany={activeCompany} />}
          />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
};

export default App;
