import React, { useState } from "react";
import "./FileUploader.css";

const REQUIRED_FILES = [
  "የይዞታ ማረጋገጫ ፋይል",
  "ሊዝ የተከፈለበት ደረሰኝ ፋይል",
  "የንብረት ግብር ደረሰኝ ፋይል",
  "የግብር ደረሰኝ ፋይል",
];

export default function FileUploader({
  requiredFiles,
  setRequiredFiles,
  files,
  setFiles,
}) {
  // Additional file upload state
  const [step, setStep] = useState(1);
  const [newName, setNewName] = useState("");
  const [newFile, setNewFile] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editName, setEditName] = useState("");
  const [editFile, setEditFile] = useState(null);

  // File type/size validation
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const maxSizeMB = 10;

  // Handle required file upload
  const handleRequiredFileChange = (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      alert("This file type is not allowed.");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert("File is too large. Max size is 10MB.");
      return;
    }
    const blobURL = URL.createObjectURL(file);
    const updated = [...requiredFiles];
    updated[idx] = {
      ...updated[idx],
      file,
      url: blobURL,
      type: file.type,
      date: new Date().toLocaleString(),
      originalName: file.name,
    };
    setRequiredFiles(updated);
  };

  // Remove required file
  const handleRemoveRequiredFile = (idx) => {
    const updated = [...requiredFiles];
    if (updated[idx].url) URL.revokeObjectURL(updated[idx].url);
    updated[idx] = {
      ...updated[idx],
      file: null,
      url: null,
      type: "",
      date: "",
      originalName: "",
    };
    setRequiredFiles(updated);
  };

  // Additional file logic (unchanged)
  const handleNext = () => {
    if (newName.trim()) setStep(2);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      alert("This file type is not allowed.");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert("File is too large. Max size is 10MB.");
      return;
    }
    setNewFile(file);
  };

  const handleAddFile = () => {
    if (!newFile || files.length >= 20) return;
    const blobURL = URL.createObjectURL(newFile);
    const entry = {
      name: newName,
      originalName: newFile.name,
      type: newFile.type,
      date: new Date().toLocaleString(),
      file: newFile,
      url: blobURL,
    };
    setFiles((prev) => [...prev, entry]);
    setNewName("");
    setNewFile(null);
    setStep(1);
  };

  const startEdit = (idx) => {
    setEditingIndex(idx);
    setEditName(files[idx].name);
    setEditFile(null);
  };

  const handleEditFileSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!allowedTypes.includes(f.type)) {
      alert("This file type is not allowed.");
      return;
    }
    if (f.size > maxSizeMB * 1024 * 1024) {
      alert("File is too large. Max size is 10MB.");
      return;
    }
    setEditFile(f);
  };

  const handleSaveEdit = () => {
    const updated = [...files];
    const newBlobURL = editFile
      ? URL.createObjectURL(editFile)
      : updated[editingIndex].url;
    updated[editingIndex] = {
      ...updated[editingIndex],
      name: editName,
      originalName: editFile
        ? editFile.name
        : updated[editingIndex].originalName,
      type: editFile ? editFile.type : updated[editingIndex].type,
      date: new Date().toLocaleString(),
      file: editFile || updated[editingIndex].file,
      url: newBlobURL,
    };
    setFiles(updated);
    setEditingIndex(null);
    setEditFile(null);
  };

  const handleDelete = (idx) => {
    const toDelete = files[idx];
    if (toDelete.url) URL.revokeObjectURL(toDelete.url);
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Only allow final save if all required files are present
  const allRequiredUploaded = requiredFiles.every((f) => !!f.file);

  return (
    <div className="uploader-container uploader-container--vertical">
      <h3 className="uploader-container__title">Required Files</h3>
      <div className="uploader-required-row-vertical">
        {requiredFiles.map((f, idx) => (
          <div className="uploader-required-item-vertical" key={f.name}>
            <label className="uploader-required-label">{f.name}</label>
            <input
              type="file"
              onChange={(e) => handleRequiredFileChange(idx, e)}
              disabled={!!f.file}
              aria-label={`Upload ${f.name}`}
              className="uploader-required-input"
              style={{
                fontSize: "0.95rem",
                padding: "0.2rem 0.5rem",
                height: "2rem",
              }}
            />
            {f.file ? (
              <div
                className="file-action-buttons"
                style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
              >
                <span
                  className="uploader-required-success"
                  style={{ fontSize: "0.95rem" }}
                >
                  {f.originalName} (uploaded)
                </span>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  View
                </a>
                <button
                  className="btn btn-red btn-xs"
                  onClick={() => handleRemoveRequiredFile(idx)}
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  style={{ fontSize: "0.9rem", padding: "2px 8px" }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <span
                className="uploader-required-missing"
                style={{ fontSize: "0.95rem" }}
              >
                Required
              </span>
            )}
          </div>
        ))}
      </div>

      <hr style={{ margin: "2rem 0" }} />

      <h3>Additional Files</h3>
      {!allRequiredUploaded && (
        <div style={{ color: "#cc0000", marginBottom: "1rem" }}>
          Please upload all required files before adding additional files.
        </div>
      )}

      {/* Additional file upload UI */}
      <div
        style={{
          opacity: allRequiredUploaded ? 1 : 0.5,
          pointerEvents: allRequiredUploaded ? "auto" : "none",
        }}
      >
        {step === 1 && (
          <div>
            <label>
              <span>File Display Name</span>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
                className="input-field"
                placeholder="Enter a name"
              />
            </label>
            <button onClick={handleNext} className="btn btn-green">
              Next: Select File
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <input type="file" onChange={handleFileSelect} />
            <div style={{ marginTop: "1rem" }}>
              <button
                onClick={handleAddFile}
                className="btn btn-blue"
                disabled={!newFile}
              >
                Add to List
              </button>
              <button onClick={() => setStep(1)} className="btn btn-gray">
                Back
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Date</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Required files */}
            {requiredFiles.map((f, idx) => (
              <tr key={`required-${f.name}`}>
                <td>{f.name}</td>
                <td>
                  <span style={{ color: "#4BB543", fontWeight: "bold" }}>
                    Required
                  </span>
                </td>
                <td className="text-sm">{f.date}</td>
                <td className="text-sm">{f.type}</td>
                <td>
                  {f.file ? (
                    <div
                      className="file-action-buttons"
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                      >
                        View
                      </a>
                      <button
                        className="btn btn-red btn-xs"
                        onClick={() => handleRemoveRequiredFile(idx)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: "#cc0000" }}>Required</span>
                  )}
                </td>
              </tr>
            ))}
            {/* Additional files */}
            {files.map((f, idx) => (
              <tr key={`additional-${idx}`}>
                <td style={{ minWidth: "180px" }}>
                  {editingIndex === idx ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input-field"
                      style={{ marginBottom: 0, marginRight: "0.7rem" }} // Add right margin to prevent overlap
                    />
                  ) : (
                    f.name
                  )}
                </td>
                <td style={{ minWidth: "120px" }}>
                  <span style={{ color: "#007bff" }}>Additional</span>
                </td>
                <td className="text-sm">{f.date}</td>
                <td className="text-sm">
                  {editingIndex === idx ? (
                    <input
                      type="file"
                      onChange={handleEditFileSelect}
                      style={{ marginBottom: 0, marginLeft: "0.7rem" }} // Add left margin to prevent overlap
                    />
                  ) : (
                    f.type
                  )}
                </td>
                <td>
                  {editingIndex === idx ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      <button
                        onClick={handleSaveEdit}
                        className="btn btn-green"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="btn btn-gray"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div
                      className="file-action-buttons"
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                      >
                        View
                      </a>
                      <button
                        onClick={() => startEdit(idx)}
                        className="btn btn-yellow"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(idx)}
                        className="btn btn-red"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add this button below the table */}
      <button
        type="button"
        className="btn btn-blue"
        style={{
          marginTop: "2rem",
          alignSelf: "center",
          minWidth: "180px",
          fontSize: "1rem",
        }}
        onClick={() =>
          window.dispatchEvent(new Event("closeFileUploaderModal"))
        }
      >
        Go Back to Save
      </button>
    </div>
  );
}
