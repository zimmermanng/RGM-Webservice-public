import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readExcelFile } from "../services/dataExtractor";
import { MdUpload } from "react-icons/md";

const UploadPage = ({ onUpload }) => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const splitFileName = (name, maxLength = 25) => {
    if (name.length <= maxLength) return [name];

    const regex = /([-_.])/g;
    const parts = name.split(regex);
    const lines = [];
    let currentLine = "";

    parts.forEach((part) => {
      if ((currentLine + part).length <= maxLength) {
        currentLine += part;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = part;
      }
    });

    if (currentLine) lines.push(currentLine);

    return lines;
  };

  const handleConfirmUpload = () => {
    if (!selectedFile) return;

    readExcelFile(
      selectedFile,
      (processedData) => {
        onUpload(processedData);
        navigate("/results");
      },
      {
        downloadJson: true,
        logToConsole: true,
      }
    );
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <main className="uploadPage mainContainer outline" id="top">
      <header className="uploadHeader">
        <h1>Upload</h1>
        <p id="upload-instructions">
          Hier können Sie sich die Auswertung der Selbstbewertung, die Sie offline ausgefüllt haben, anzeigen lassen. <br />
          Laden Sie dafür die ausgefüllte Datei hoch und bestätigen Sie die Auswahl.</p>
      </header>

      <section className="upload-box" aria-labelledby="upload-box-title" aria-describedby="upload-instructions">
        <MdUpload className="upload-icon" aria-hidden="true" focusable="false" />
        <h3 id="upload-box-title">Datei hochladen</h3>

        <input
          id="file-upload"
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="file-input-hidden"
          aria-describedby="upload-instructions"
          accept=".xlsx,.xls"
        />

        <button type="button" className="upload-button" onClick={handleUploadButtonClick}>
          Datei auswählen
        </button>

        {selectedFile && (
          <div className="file-preview" aria-live="polite">
            <p>Datei ausgewählt:</p>
            <div className="bold">
              {splitFileName(selectedFile.name, 25).map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
            <button type="button" className="confirm-button" onClick={handleConfirmUpload}>
              Datei bestätigen und hochladen
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default UploadPage;
