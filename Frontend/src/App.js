import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar/navBar";
import UploadPage from "./pages/UploadPage";
import Footer from "./components/Footer/footer";
import "./App.css";


const App = () => {
    const [data, setData] = useState([]);

    return (
   
            <Router>
                <NavBar />
                <main>
                    <Routes>
{/*                         <Route path="/" element={<MainPage />} />
                        <Route path="/tutorial" element={<Tutorial />} />
                        <Route path="/download" element={<Download />} />
                        <Route path="/results" element={<ResultPage data={data} />} /> */}

                        {/* 🔹 Protect the Upload Page */}
                        { <Route path="/upload" element={<UploadPage onUpload={setData} />} /> }

                    </Routes>
                </main>
                <Footer />
            </Router>
   
    );
};

export default App;