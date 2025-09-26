import React, { useState } from "react";
// REMOVE: import axios from "axios";
import axiosInstance from "../../utils/axiosInstance"; // CORRECT: Import axiosInstance
import authService from "../../services/authService"; // Keep authService if needed for other checks, though axiosInstance handles tokens
import "./EditFile.css";

export default function EditFile() {
  const [formData, setFormData] = useState(null);
  const [files, setFiles] = useState([]);
  const [upinSearch, setUpinSearch] = useState("");
  const [showFiles, setShowFiles] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [additionalFiles, setAdditionalFiles] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  const REQUIRED_FIELDS = [
    "UPIN",
    "PropertyOwnerName",
    "ServiceOfEstate",
    "placeLevel",
    "possessionStatus",
    "spaceSize",
    "kebele",
    "proofOfPossession",
    "DebtRestriction",
    "LastTaxPaymtDate",
    "lastDatePayPropTax",
    "EndLeasePayPeriod",
    "FolderNumber",
    "Row",
    "ShelfNumber",
    "NumberOfPages",
    "PhoneNumber",
    "NationalId",
    "sortingNumber",
  ];
  // Amharic field labels mapping
  const amharicLabels = {
    PropertyOwnerName: "የባለቤት ስም",
    UPIN: "UPIN",
    PhoneNumber: "ስልክ ቁጥር",
    NationalId: "Fayda Number",
    ServiceOfEstate: "የንብረት አገልግሎት",
    placeLevel: "የቦታ ደረጃ",
    possessionStatus: "የይዞታ ሁኔታ",
    spaceSize: "የቦታ መጠን",
    kebele: "ቀበሌ",
    proofOfPossession: "የይዞታ ማረጋገጫ",
    DebtRestriction: "እዳና እገዳ",
    LastTaxPaymtDate: "የግብር የመጨረሻ የተከፈለበት ዘመን",
    lastDatePayPropTax: "የንብረት ግብር የመጨረሻ የተከፈለበት ዘመን",
    EndLeasePayPeriod: "የሊዝ መጨረሻ የተከፈለበት ዘመን",
    FolderNumber: "አቃፊ ቁጥር",
    Row: "ረድፍ",
    ShelfNumber: "የሸልፍ ቁጥር",
    NumberOfPages: "የሰነድ ገፅ ብዛት",
    sortingNumber: "መደርደሪያ ቁጥር",
  };

  // Toast handler
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 2500);
  };

  const handleSearch = async () => {
    setSearchError("");
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
        const filteredData = {};
        Object.keys(amharicLabels).forEach((key) => {
          if (res.data[0][key] !== undefined) {
            filteredData[key] = res.data[0][key];
          }
        });
        setFormData(filteredData);
        setShowFiles(false);
        setFiles([]);
        setAdditionalFiles([]);
        setSearchError("");
        fetchFiles(res.data[0].UPIN);
      } else {
        setFormData(null);
        setFiles([]);
        setAdditionalFiles([]);
        setShowFiles(false);
        setSearchError("No record found for this UPIN.");
      }
    } catch (error) {
      console.error(
        "Error searching record:",
        error.response?.status,
        error.response?.data
      );
      setSearchError("Error fetching record.");
    }
    setUpinSearch("");
  };

  function validateFaydaNumber(value) {
    // Ethiopian Fayda Number: 12 digits, all numbers
    return /^\d{12}$/.test(value.trim());
  }

  const fetchFiles = async (upin) => {
    try {
      // CHANGED: axios.get to axiosInstance.get, removed headers
      const res = await axiosInstance.get(
        `http://localhost:8000/api/records/${upin}/files/`
      );
      setFiles(res.data);
      setShowFiles(true);
    } catch (error) {
      console.error(
        "Error fetching files:",
        error.response?.status,
        error.response?.data
      );
      showToast("Error fetching files.", "error");
    }
  };

  const handleReplaceFile = async (fileId, newFile, upin) => {
    const formData = new FormData();
    formData.append("uploaded_file", newFile);

    try {
      // CHANGED: axios.put to axiosInstance.put, removed authService.getAuthHeaders()
      const res = await axiosInstance.put(
        `http://localhost:8000/api/files/${fileId}/replace/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // Keep this for file uploads
          },
        }
      );
      if (res.status === 200) {
        showToast("File replaced successfully.");
        if (upin) {
          fetchFiles(upin);
        } else {
          showToast("UPIN is missing. Unable to refresh files.", "error");
        }
      } else {
        const errorData = res.data;
        console.error("Failed to replace file:", errorData);
        showToast(
          `Failed to replace file: ${JSON.stringify(errorData)}`,
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Error replacing file:",
        error.response?.status,
        error.response?.data
      );
      showToast("Error replacing file.", "error");
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      // CHANGED: axios.delete to axiosInstance.delete, removed headers
      const res = await axiosInstance.delete(
        `http://localhost:8000/api/files/${fileId}/delete/`
      );
      if (res.status === 204) {
        showToast("File deleted successfully.");
        setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
      } else {
        const errorData = res.data;
        console.error("Failed to delete file:", errorData);
        showToast(
          `Failed to delete file: ${JSON.stringify(errorData)}`,
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Error deleting file:",
        error.response?.status,
        error.response?.data
      );
      showToast("Error deleting file.", "error");
    }
  };

  const handleSaveRecord = async () => {
    // Check for validation errors
    if (Object.values(formErrors).some((error) => error)) {
      showToast("Please fix validation errors before saving.", "error");
      return;
    }

    // Check for required fields
    const missingFields = REQUIRED_FIELDS.filter(
      (field) =>
        !formData[field] ||
        (typeof formData[field] === "string" && formData[field].trim() === "")
    );

    if (missingFields.length > 0) {
      const missingFieldsLabels = missingFields
        .map((field) => amharicLabels[field] || field)
        .join(", ");
      showToast(
        `Please fill in the required fields: ${missingFieldsLabels}`,
        "error"
      );
      return;
    }

    try {
      // Validate UPIN before proceeding
      if (!formData.UPIN || formData.UPIN.trim() === "") {
        showToast(
          "UPIN is missing. Please search for a record first.",
          "error"
        );
        return;
      }

      // Save record details
      // CHANGED: axios.put to axiosInstance.put, removed headers
      const recordRes = await axiosInstance.put(
        `http://localhost:8000/api/records/${formData.UPIN}/`,
        formData
      );

      if (recordRes.status === 200) {
        // Save additional files
        for (const file of additionalFiles) {
          const fileFormData = new FormData();
          fileFormData.append("uploaded_file", file.file);
          fileFormData.append("display_name", file.name);
          fileFormData.append("category", "additional");

          // CHANGED: axios.post to axiosInstance.post, removed authService.getAuthHeaders()
          const fileRes = await axiosInstance.post(
            `http://localhost:8000/api/files/${formData.UPIN}/upload/`,
            fileFormData,
            {
              headers: {
                "Content-Type": "multipart/form-data", // Keep this for file uploads
              },
            }
          );

          if (fileRes.status !== 201) {
            showToast("Failed to upload additional file.", "error");
          }
        }

        // After uploading all additional files
        showToast("Record and files saved successfully.");
        fetchFiles(formData.UPIN); // <-- Add this to refresh the file list
        resetForm();
      } else {
        const errorData = recordRes.data;
        console.error("Failed to update record:", errorData);
        showToast(
          `Failed to update record: ${JSON.stringify(errorData)}`,
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Error saving record and files:",
        error.response?.status,
        error.response?.data
      );
      showToast("Error saving record and files.", "error");
    }
  };

  const [additionalFile, setAdditionalFile] = useState(null);
  const [additionalFileName, setAdditionalFileName] = useState("");

  const addAdditionalFile = (file, name) => {
    if (!file || !name.trim()) {
      showToast("Please provide a file and a name.", "error");
      return;
    }
    setAdditionalFiles((prevFiles) => [...prevFiles, { file, name }]);
    setAdditionalFile(null); // Reset file input
    setAdditionalFileName(""); // Reset name input
    showToast("Additional File added to the list.");
  };

  const resetForm = () => {
    setFormData(null);
    setFiles([]);
    setAdditionalFiles([]);
    setShowFiles(false);
    setSearchError("");
    setFormErrors({});
  };

  return (
    <div>
      {toast.show && (
        <div
          class={`toast ${toast.type}`}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: toast.type === "success" ? "green" : "red",
            color: toast.type === "success" ? "white" : "white",
            padding: "10px 15px",
            borderRadius: "5px",
            boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
            zIndex: 1000,
            maxWidth: "300px",
            wordWrap: "break-word",
          }}
        >
          {toast.message}
        </div>
      )}
      <div className="edit-file-container">
        <h2>Edit Record and Files</h2>
        <div className="search-bar" style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Enter UPIN"
            value={upinSearch}
            onChange={(e) => setUpinSearch(e.target.value)}
          />
          <button className="search-button" onClick={handleSearch}>
            Search
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

        {formData && (
          <>
            <div className="record-details">
              <h2>የባለይዞታው ሙሉ ሰነድ</h2>
              {Object.entries(formData).map(([key, value]) => {
                // Define select options for fields that use select in AddFile.js
                const selectOptions = {
                  ServiceOfEstate: [
                    "",
                    "ለመኖረያ",
                    "ለንግድ",
                    "የመንግስት",
                    "የሐይማኖት ተቋም",
                    "ኢንቨስትመንት",
                    "የቀበሌ",
                    "የኪይ ቤቶች",
                    "ኮንዲኒሚየም",
                    "መንገድ",
                    "የማሃበር",
                    "ሌሎች",
                  ],
                  placeLevel: ["", "1ኛ", "2ኛ", "3ኛ", "4ኛ"],
                  possessionStatus: ["", "ነባር", "ሊዝ"],
                  kebele: [
                    "",
                    "01",
                    "02",
                    "03",
                    "04",
                    "05",
                    "06",
                    "07",
                    "08",
                    "09",
                    "10",
                    "11",
                    "12",
                    "13",
                    "14",
                    "15",
                    "16",
                    "17",
                    "18",
                    "19",
                  ],
                  proofOfPossession: [
                    "",
                    "ካርታ",
                    "ሰነድ አልባ",
                    "ህገ-ውፕ",
                    "ምንም የሌለው",
                  ],
                  DebtRestriction: ["", "እዳ", "እገዳ", "ነፃ"],
                };

                // Render select if key matches, otherwise render input
                if (Object.keys(selectOptions).includes(key)) {
                  return (
                    <div key={key}>
                      <label>{amharicLabels[key]}</label>
                      <select
                        className="form-input"
                        value={value}
                        onChange={(e) => {
                          setFormData({ ...formData, [key]: e.target.value });
                          setFormErrors((prev) => ({
                            ...prev,
                            [key]:
                              e.target.value.trim() === ""
                                ? "This field is required."
                                : "",
                          }));
                        }}
                        disabled={key === "UPIN"}
                      >
                        {selectOptions[key].map((opt) => (
                          <option key={opt} value={opt}>
                            {opt === "" ? "Select" : opt}
                          </option>
                        ))}
                      </select>
                      {formErrors[key] && (
                        <div
                          style={{
                            color: "#cc0000",
                            fontSize: "0.85em",
                            marginTop: "4px",
                          }}
                        >
                          {formErrors[key]}
                        </div>
                      )}
                    </div>
                  );
                }
                // ...existing code for input...
                return (
                  <div key={key} style={{ position: "relative" }}>
                    <label>{amharicLabels[key]}</label>
                    <input
                      className="form-input"
                      type="text"
                      value={value}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setFormData({ ...formData, [key]: newValue });

                        // Perform validation based on the field
                        let error = "";
                        if (key === "PropertyOwnerName") {
                          const characterOnlyRegex =
                            /^[A-Za-z\u1200-\u135A\s]*$/;
                          error = characterOnlyRegex.test(newValue)
                            ? ""
                            : "Please enter only valid Amharic or English characters.";
                        } else if (key === "PhoneNumber") {
                          const ethiopianPhoneRegex =
                            /^(?:\+251|0)(7\d{8}|9\d{8})$/;
                          error =
                            newValue.trim() === ""
                              ? ""
                              : ethiopianPhoneRegex.test(newValue)
                              ? ""
                              : "Invalid phone number. Use +2519XXXXXXXX, +2517XXXXXXXX, 09XXXXXXXX, or 07XXXXXXXX format.";
                        } else if (
                          key === "LastTaxPaymtDate" ||
                          key === "lastDatePayPropTax" ||
                          key === "EndLeasePayPeriod"
                        ) {
                          const parsed = parseInt(newValue, 10);
                          const ethiopianYear = new Date().getFullYear() - 8;
                          error =
                            !newValue ||
                            isNaN(parsed) ||
                            parsed < 1950 ||
                            parsed > ethiopianYear
                              ? `Please enter a year between 1950 and ${ethiopianYear}.`
                              : "";
                        } else if (key === "NationalId") {
                          error =
                            newValue.trim() === ""
                              ? "This field is required."
                              : validateFaydaNumber(newValue)
                              ? ""
                              : "Invalid Fayda Number. It must be a 12-digit number.";
                        }

                        setFormErrors((prevErrors) => ({
                          ...prevErrors,
                          [key]: error,
                        }));
                      }}
                      onBlur={(e) => {
                        const newValue = e.target.value;

                        let error = "";
                        if (key === "PropertyOwnerName") {
                          const characterOnlyRegex =
                            /^[A-Za-z\u1200-\u135A\s]*$/;
                          error = characterOnlyRegex.test(newValue)
                            ? ""
                            : "Please enter only valid Amharic or English characters.";
                        } else if (key === "PhoneNumber") {
                          const ethiopianPhoneRegex =
                            /^(?:\+251|0)(7\d{8}|9\d{8})$/;
                          error =
                            newValue.trim() === ""
                              ? ""
                              : ethiopianPhoneRegex.test(newValue)
                              ? ""
                              : "Invalid phone number. Use +2519XXXXXXXX, +2517XXXXXXXX, 09XXXXXXXX, or 07XXXXXXXX format.";
                        } else if (
                          key === "LastTaxPaymtDate" ||
                          key === "lastDatePayPropTax" ||
                          key === "EndLeasePayPeriod"
                        ) {
                          const parsed = parseInt(newValue, 10);
                          const ethiopianYear = new Date().getFullYear() - 8;
                          error =
                            !newValue ||
                            isNaN(parsed) ||
                            parsed < 1950 ||
                            parsed > ethiopianYear
                              ? `Please enter a year between 1950 and ${ethiopianYear}.`
                              : "";
                        } else if (key === "NationalId") {
                          error =
                            newValue.trim() === ""
                              ? "This field is required."
                              : validateFaydaNumber(newValue)
                              ? ""
                              : "Invalid Fayda Number. It must be a 12-digit number.";
                        }

                        setFormErrors((prevErrors) => ({
                          ...prevErrors,
                          [key]: error,
                        }));
                      }}
                      readOnly={key === "UPIN"} // <-- Make UPIN uneditable
                    />
                    {formErrors[key] && (
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
                        {formErrors[key]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {showFiles && (
              <div className="files-uploaded-section">
                <h4>Attached Files</h4>
                {files.length === 0 ? (
                  <div>No files found for this record.</div>
                ) : (
                  <ul className="file-list">
                    {files.map((file) => (
                      <li key={file.id}>
                        <span
                          className="file-icon"
                          role="img"
                          aria-label="file"
                        >
                          📄
                        </span>
                        <span className="file-name">
                          {file.display_name ||
                            file.uploaded_file.split("/").pop()}
                        </span>
                        <span className="file-category">{file.category}</span>
                        <a
                          className="file-view-link"
                          href={`http://localhost:8000${
                            file.uploaded_file
                          }?t=${Date.now()}`} // Add cache-buster
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </a>
                        <input
                          type="file"
                          onChange={(e) =>
                            handleReplaceFile(
                              file.id,
                              e.target.files[0],
                              formData.UPIN
                            )
                          }
                        />
                        {file.category !== "required" && (
                          <button
                            className="delete-file-btn"
                            onClick={() => handleDeleteFile(file.id)}
                          >
                            Delete
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="additional-file-upload-section">
              <h4>Upload Additional Files</h4>
              <input
                type="text"
                placeholder="Enter file name"
                value={additionalFileName}
                onChange={(e) => setAdditionalFileName(e.target.value)}
              />
              <input
                type="file"
                onChange={(e) => setAdditionalFile(e.target.files[0])}
              />
              <button
                onClick={() =>
                  addAdditionalFile(additionalFile, additionalFileName)
                }
              >
                Add File
              </button>

              <div className="additional-files-list">
                {additionalFiles.map((file, index) => (
                  <div key={index} className="additional-file-item">
                    <span className="file-icon" role="img" aria-label="file">
                      📄
                    </span>
                    <span className="file-name">{file.name}</span>
                    <span className="file-category">Additional</span>{" "}
                    <button
                      className="view-file-btn"
                      onClick={() => {
                        const fileURL = URL.createObjectURL(file.file);
                        window.open(fileURL, "_blank");
                      }}
                    >
                      View
                    </button>
                    <button
                      className="remove-file-btn"
                      onClick={() => {
                        setAdditionalFiles((prevFiles) =>
                          prevFiles.filter((_, i) => i !== index)
                        );
                        showToast("File removed from the list.");
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button className="save-record-btn" onClick={handleSaveRecord}>
              Save Record
            </button>
          </>
        )}
      </div>
    </div>
  );
}
