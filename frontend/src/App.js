import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import NavBar from "./components/NavBar/navBar";
import Footer from "./components/Footer/footer";

import ScrollToTop from "./components/ScrollToTop";
import UploadPage from "./pages/UploadPage";
import ResultPage from "./pages/ResultPage";
import Download from "./pages/DownloadPage";
import QuestionnairePage from "./pages/QuestionnairePage";
import DimensionsPage from "./pages/DimensionsPage";
import ShuffleHomePage from "./pages/shuffleHomePage";
import RawResults from "./pages/RawResults";

import { applyTheme } from "./theme";
import "./App.css";

const App = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    applyTheme();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <NavBar />

      <main>
        <Routes>
          <Route
            path="/"
            element={<ShuffleHomePage />}
          />

          <Route
            path="/start"
            element={<ShuffleHomePage />}
          />

          <Route path="/download" element={<Download />} />

          <Route path="/upload" element={<UploadPage onUpload={setData} />} />

          <Route
            path="/dimensions"
            element={<DimensionsPage />}
          />

          <Route
            path="/questionnaire"
            element={<QuestionnairePage />}
          />

          <Route
            path="/questionnaire/:dimensionId/:handlungsfeldId"
            element={<QuestionnairePage />}
          />

          <Route
            path="/results"
            element={<ResultPage data={data} />}
          />

          <Route
            path="/rawresults"
            element={<RawResults data={data} />}
          />

          <Route
            path="/handlungsempfehlungen"
            element={<ResultPage data={data} />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </Router>
  );
};

export default App;