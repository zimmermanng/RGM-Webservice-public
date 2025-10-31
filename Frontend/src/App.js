import React, { useState, useEffect } from "react";
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

const App = () => {
  const [data, setData] = useState([]);

  const activeCompany = "LMZ"; // <-- hier umstellen, um das Design zu wechseln

  useEffect(() => {
    applyTheme(activeCompany);
  }, [activeCompany]);

  return (
    <Router>
       <NavBar activeCompany={activeCompany} />
      <main>
        <Routes>
          <Route path="/download" element={<Download />} />
          <Route path="/questionnaire" element={<QuestionnairePage />} />
          <Route
            path="/questionnaire/:dimensionId"
            element={<QuestionnairePage />}
          />
          <Route path="/results" element={<ResultPage data={data} />} />
          <Route
            path="/handlungsempfehlungen"
            element={<ResultPage data={data} />}
          />
          <Route path="/upload" element={<UploadPage onUpload={setData} />} />
          <Route path="/dimensions" element={<DimensionsPage />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
};

export default App;

