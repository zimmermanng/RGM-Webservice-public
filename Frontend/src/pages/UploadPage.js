import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { readExcelFile } from '../services/dataExtractor';
import { MdUpload } from "react-icons/md";
import './UploadPage.css';

const UploadPage = ({ onUpload }) => {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = React.useRef(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const splitFileName = (name, maxLength = 25) => {
        if (name.length <= maxLength) return [name]; // No need to split if it's short enough
    
        const regex = /([-_.])/g; // Match the delimiters
        let parts = name.split(regex); // Split but keep delimiters
    
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
    
        if (currentLine) lines.push(currentLine); // Add the last part
    
        return lines;
    };
    

    const handleConfirmUpload = () => {
        if (selectedFile) {
            readExcelFile(selectedFile, (processedData) => {
                onUpload(processedData);
                navigate('/results');
            });
        }
    };

    const handleUploadButtonClick = () => {
        fileInputRef.current.click(); // Triggers file input click
    };

    return (
        <div className='mainContainer' id="top">
            <h1>Upload</h1>
            <h2>Selbstauswertung und Visualisierung des RGM</h2>
            <p>Bitte laden Sie eine Datei hoch und bestätigen Sie die Auswahl.</p>

            <div className="upload-box">
                <div>
                    <MdUpload className="upload-icon" />
                    <h3>Datei hochladen</h3>
                    
                    {/* Hidden File Input */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="file-input-hidden"
                    />

                    {/* Custom Upload Button */}
                    <button className="upload-button" onClick={handleUploadButtonClick}>
                        Datei auswählen
                    </button>
                    
                    {selectedFile && (
    <div className="file-preview">
        <p>Datei ausgewählt:</p> 
        <div className='bold'>
            {splitFileName(selectedFile.name, 25).map((line, index) => (
                <p key={index}>{line}</p>
            ))}
        </div>
        <button className="confirm-button" onClick={handleConfirmUpload}>
            Datei bestätigen und hochladen
        </button>
    </div>
)}
                </div>
            </div>
        </div>
    );
};

export default UploadPage;
