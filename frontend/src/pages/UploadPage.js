import React, { useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { readExcelFile } from "../services/dataExtractor";
import { MdUpload } from "react-icons/md";

const UploadPage = ({ onUpload }) => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState({ text: "", type: "" });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const fileInputId = useId();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    if (file) {
      setSelectedFile(file);
      setUploadMessage(
        { text: `Datei ausgewählt: ${file.name}`, type: "status" }
      );
      return;
    }

    setSelectedFile(null);
    setUploadMessage({ text: "", type: "" });
  };

  const splitFileName = (name, maxLength = 25) => {
    if (name.length <= maxLength) return [name];

    const regex = /([-_.])/g;
    let parts = name.split(regex);

    let lines = [];
    let currentLine = "";

    for (let part of parts) {
      if ((currentLine + part).length <= maxLength) {
        currentLine += part;
      } else {
        lines.push(currentLine);
        currentLine = part;
      }
    }

    if (currentLine) lines.push(currentLine);

    return lines;
  };

  const handleConfirmUpload = () => {
    if (!selectedFile) {
      setUploadMessage({
        text: "Bitte wählen Sie zuerst eine Datei aus.",
        type: "error",
      });
      return;
    }

    setIsUploading(true);
    setUploadMessage({
      text: "Datei wird verarbeitet...",
      type: "status",
    });

    try {
      readExcelFile(
        selectedFile,
        (processedData) => {
          setUploadMessage({
            text: "Datei erfolgreich verarbeitet. Weiterleitung zu den Ergebnissen.",
            type: "status",
          });
          onUpload(processedData);
          navigate("/results");
        },
        {
          downloadJson: true,
          logToConsole: true,
          // sheetName: 'Datenexport',
          // filename: 'my-results.json',
        }
      );
    } catch (error) {
      console.error("Fehler beim Verarbeiten der Datei:", error);
      setUploadMessage({
        text: "Die Datei konnte nicht verarbeitet werden.",
        type: "error",
      });
      setIsUploading(false);
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mainContainer outline" id="top">
      <h1>Upload</h1>
      <h2>Selbstauswertung und Visualisierung des RGM</h2>
      <p>Bitte laden Sie eine Datei hoch und bestätigen Sie die Auswahl.</p>

      {uploadMessage.text && (
        <div
          className="access-error access-error-prominent"
          role={uploadMessage.type === "error" ? "alert" : "status"}
          aria-live={uploadMessage.type === "error" ? "assertive" : "polite"}
        >
          {uploadMessage.text}
        </div>
      )}

      <div className="upload-box">
        <div>
          <MdUpload className="upload-icon" />
          <h3>Datei hochladen</h3>

          <label htmlFor={fileInputId} className="sr-only">
            Excel-Datei zum Hochladen auswählen
          </label>
          <input
            id={fileInputId}
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="file-input-hidden"
            accept=".xlsx,.xls,.csv"
            aria-describedby={uploadMessage.text ? "upload-status-message" : undefined}
          />

          <button
            type="button"
            className="upload-button"
            onClick={handleUploadButtonClick}
            disabled={isUploading}
          >
            Datei auswählen
          </button>

          {selectedFile && (
            <div className="file-preview">
              <p>Datei ausgewählt:</p>
              <div className="bold">
                {splitFileName(selectedFile.name, 25).map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
              <button
                type="button"
                className="confirm-button"
                onClick={handleConfirmUpload}
                disabled={isUploading}
              >
                {isUploading
                  ? "Datei wird verarbeitet..."
                  : "Datei bestätigen und hochladen"}
              </button>
            </div>
          )}

          <div
            id="upload-status-message"
            className="sr-only"
            role={uploadMessage.type === "error" ? "alert" : "status"}
            aria-live={uploadMessage.type === "error" ? "assertive" : "polite"}
          >
            {uploadMessage.text}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;