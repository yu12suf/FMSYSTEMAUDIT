import React, { useState } from "react";
// REMOVE: import axios from "axios";
import axiosInstance from "../../utils/axiosInstance"; // CORRECT: Import axiosInstance
import "./ViewFile.css";
import TaxForm from "../TaxForm/TaxForm";
import authService from "../../services/authService"; // Keep authService if needed for other checks, though axiosInstance handles tokens

export default function ViewFile() {
  const [formData, setFormData] = useState(null);
  const [files, setFiles] = useState([]);
  const [upinSearch, setUpinSearch] = useState("");
  const [showFiles, setShowFiles] = useState(false);
  const [formErrors, setFormErrors] = useState({}); // Keep as per your request
  const [searchError, setSearchError] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Toast handler
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 2500);
  };

  const handleSearch = async () => {
    setSearchError(""); // Clear previous error
    if (!upinSearch) return;
    try {
      // CHANGED: axios.get to axiosInstance.get, removed headers
      const res = await axiosInstance.get(
        `http://localhost:8000/api/records/search/`,
        {
          params: { UPIN: upinSearch },
        }
      );

      if (res.data.length) {
        setFormData(res.data[0]);
        setShowFiles(false);
        setFiles([]);
        setSearchError(""); // Clear error on success
      } else {
        setFormData(null);
        setFiles([]);
        setShowFiles(false);
        setSearchError("ይህን ዩፒኤን ያላቸው መዝገቦች አልተገኙም።"); // Amharic: No record found for this UPIN.
      }
    } catch (error) {
      console.error(
        "Error fetching record:",
        error.response?.status,
        error.response?.data
      );
      setSearchError("መዝገብ ማግኘት አልተቻለም።"); // Amharic: Error fetching record.
    }
    setUpinSearch("");
  };

  const loadFiles = async () => {
    if (!formData?.UPIN) return;
    try {
      // CHANGED: axios.get to axiosInstance.get, removed headers
      const res = await axiosInstance.get(
        `http://localhost:8000/api/records/${formData.UPIN}/files/`
      );
      if (res.data.length === 0) {
        setFiles([]);
        setShowFiles(true);
        showToast("No files found for this record.", "error");
      } else {
        setFiles(res.data);
        setShowFiles(true);
      }
    } catch (error) {
      console.error(
        "Error fetching files:",
        error.response?.status,
        error.response?.data
      );
      if (error.response?.status === 404) {
        showToast("No files found for this record.", "error");
      } else {
        showToast("Error fetching files.");
      }
    }
  };

  // Amharic field labels mapping
  const amharicLabels = {
    PropertyOwnerName: "የባለቤት ስም",
    UPIN: "ዩፒኤን",
    PhoneNumber: "ስልክ ቁጥር",
    NationalId: "Fayda Number",
    ServiceOfEstate: "የንብረት አገልግሎት",
    placeLevel: "የቦታ ደረጃ",
    possessionStatus: "የይዞታ ሁኔታ",
    spaceSize: "የቦታ መጠን",
    kebele: "ቀበሌ",
    proofOfPossession: "የይዞታ ማረጋገጫ",
    DebtRestriction: "የብድር ገደብ",
    LastTaxPaymtDate: "የመጨረሻ ግብር ክፍያ ቀን",
    lastDatePayPropTax: "የመጨረሻ የንብረት ግብር ክፍያ ቀን",
    EndLeasePayPeriod: "የቅጥያ ክፍያ ዘመን",
    FolderNumber: "የፎልደር ቁጥር",
    Row: "ረድፍ",
    ShelfNumber: "የመደርደሪያ ቁጥር",
    NumberOfPages: "የገፆች ብዛት",
    sortingNumber: "መደርደረያ ቁፕር",
  };

  return (
    <div>
      {toast.show && (
        <div
          className={`toast ${toast.type}`}
          style={{
            position: "fixed",
            top: "20px", // Position at the top
            right: "20px", // Align to the right
            backgroundColor: toast.type === "success" ? "#d4edda" : "red",
            color: toast.type === "success" ? "#155724" : "white",
            padding: "10px 15px", // Adjust padding for smaller height
            borderRadius: "5px",
            boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
            zIndex: 1000,
            maxWidth: "300px", // Limit width for longer messages
            wordWrap: "break-word", // Wrap text if it exceeds width
          }}
        >
          {toast.message}
        </div>
      )}
      <div className="view-file-container">
        <h2>መዝገብ እና የተያያዙ ፋይሎች እይታ</h2>
        <div className="search-bar" style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="ዩፒኤን ያስገቡ"
            value={upinSearch}
            onChange={(e) => setUpinSearch(e.target.value)}
          />
          <button className="search-button" onClick={handleSearch}>
            ፈልግ
          </button>
          {searchError && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                left: 0,
                backgroundColor: "#fff4f4",
                color: "#cc0000",
                padding: "4px 8px",
                fontSize: "0.85em",
                border: "1px solid #cc0000",
                borderRadius: "4px",
                marginTop: "4px",
                whiteSpace: "nowrap",
                boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
                zIndex: 100,
              }}
            >
              {searchError}
            </div>
          )}
        </div>

        {/* Example error display for UPIN */}
        {formErrors && formErrors.UPIN && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              backgroundColor: "#fff4f4",
              color: "#cc0000",
              padding: "4px 8px",
              fontSize: "0.85em",
              border: "1px solid #cc0000",
              borderRadius: "4px",
              marginTop: "4px",
              whiteSpace: "nowrap",
              boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
              zIndex: 100,
            }}
          >
            {formErrors.UPIN}
          </div>
        )}

        {formData && (
          <div className="record-details">
            <h3>የመዝገብ ዝርዝሮች</h3>
            {Object.entries(amharicLabels).map(([key, label]) => {
              // Only show the year for the three date fields
              if (
                key === "LastTaxPaymtDate" ||
                key === "lastDatePayPropTax" ||
                key === "EndLeasePayPeriod"
              ) {
                const value = formData[key];
                const year =
                  value && value.length >= 4 ? value.substring(0, 4) : value;
                // Calculate debt (Ethiopian year logic)
                const ethiopianYear = new Date().getFullYear() - 8;
                const debt =
                  year && /^\d{4}$/.test(year)
                    ? ethiopianYear - parseInt(year, 10)
                    : "";
                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1.5rem",
                    }}
                  >
                    <strong>{label}:</strong> {year}
                    <TaxForm debt={debt} />
                  </div>
                );
              }
              // Show all other fields as usual
              return formData[key] !== undefined && formData[key] !== "" ? (
                <div key={key}>
                  <strong>{label}:</strong> {formData[key]}
                </div>
              ) : null;
            })}
            <button
              className="upload-file-btn"
              onClick={loadFiles}
              style={{ marginTop: "1.5rem" }}
            >
              ፋይሎችን አሳይ
            </button>
          </div>
        )}

        {showFiles && (
          <div className="files-uploaded-section">
            <h4>Attached Files</h4>
            {files.length === 0 ? (
              <div>No files found for this record.</div>
            ) : (
              <ul className="file-list">
                {files.map((file) => (
                  <li key={file.id}>
                    <span className="file-icon" role="img" aria-label="file">
                      📄
                    </span>
                    <span className="file-name">
                      {file.display_name || file.uploaded_file.split("/").pop()}
                    </span>
                    <span className="file-category">{file.category}</span>
                    <a
                      className="file-view-link"
                      href={`http://localhost:8000${file.uploaded_file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
