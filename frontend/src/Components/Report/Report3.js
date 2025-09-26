import React, { useRef, useState } from "react";
// import axios from "axios"; // REMOVED: Use axiosInstance instead
import axiosInstance from "../../utils/axiosInstance"; // ADDED: Import axiosInstance

const Report3 = () => {
  const [selectedProof, setSelectedProof] = useState("");
  const [records, setRecords] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const printRef = useRef();
  const [toast, setToast] = useState({
    // ADDED: Toast state
    show: false,
    message: "",
    type: "success",
  });

  // ADDED: Toast handler function
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      2500
    );
  };

  const handlePreview = async () => {
    if (!selectedProof.trim()) {
      showToast(
        "Please select a value for 'የይዞታ ማራጋገጫ' before previewing.",
        "error"
      ); // CHANGED: alert to showToast, updated label
      return;
    }

    try {
      // CHANGED: axios.get to axiosInstance.get
      const response = await axiosInstance.get(
        `http://localhost:8000/api/records/search-by-proof/?proofOfPossession=${encodeURIComponent(
          selectedProof
        )}` // Added encodeURIComponent
      );
      setRecords(response.data);
      setShowModal(true);
      showToast("Report data loaded successfully!"); // Optional: success toast
    } catch (error) {
      console.error(
        "Error fetching data for preview:",
        error.response?.status,
        error.response?.data,
        error.message
      );
      showToast(
        "Error fetching data for preview. Please check the backend.",
        "error"
      ); // CHANGED: console.error to showToast
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  const handlePrint = async () => {
    // Made handlePrint async
    if (!selectedProof.trim()) {
      showToast(
        "Please select a value for 'የይዞታ ማራጋገጫ' before printing.",
        "error"
      ); // Added check for print as well, updated label
      return;
    }

    try {
      // Fetch data again for printing to ensure it's fresh
      const response = await axiosInstance.get(
        `http://localhost:8000/api/records/search-by-proof/?proofOfPossession=${encodeURIComponent(
          selectedProof
        )}` // Changed endpoint and parameter
      );
      const dataToPrint = response.data;

      // Build table rows
      const tableRows = dataToPrint
        .map(
          (record, index) => `
          <tr style="background-color: ${
            index % 2 === 0 ? "#f8f9fa" : "#ffffff"
          };">
            <td style="border: 1px solid black; padding: 12px 16px; text-align: left;">${
              index + 1
            }</td>
            <td style="border: 1px solid black; padding: 12px 16px; text-align: left;">${
              record.PropertyOwnerName
            }</td>
            <td style="border: 1px solid black; padding: 12px 16px; text-align: left;">${
              record.UPIN
            }</td>
            <td style="border: 1px solid black; padding: 12px 16px; text-align: left;">${
              record.kebele
            }</td>
            <td style="border: 1px solid black; padding: 12px 16px; text-align: left;">${
              record.placeLevel
            }</td>
            <td style="border: 1px solid black; padding: 12px 16px; text-align: left;">${
              record.spaceSize
            }</td>
            <td style="border: 1px solid black; background-color: green; color: white; font-weight: bold; padding: 12px 16px; text-align: left;">${
              // Changed to lastColumnCell style
              record.proofOfPossession
            }</td>
          </tr>
        `
        )
        .join("");

      // Build full HTML
      const printContent = `
        <html>
          <head>
            <title>Print Report</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                padding: 20px;
              }
              h2 {
                text-align: center;
                margin-bottom: 20px;
                font-size: 1.5rem;
                font-weight: bold;
                color: #333;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                overflow: hidden;
              }
              th {
                background-color: #007bff;
                color: white;
                font-weight: bold;
                padding: 12px 16px;
                text-align: left;
                border: 1px solid black; /* Ensure black border for print */
              }
              td {
                padding: 12px 16px;
                border: 1px solid black; /* Ensure black border for print */
                font-size: 1rem;
              }
              tr:nth-child(even) {
                background-color: #f8f9fa;
              }
              .green-cell { /* Added class for green cell */
                background-color: green;
                color: white;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <h2>የተመረጠው መረጃ</h2>
            <table>
              <thead>
                <tr>
                  <th>ተ.ቁ</th>
                  <th>ይዞታው ባለቤት ስም</th>
                  <th>UPIN</th>
                  <th>ቀበሌ</th>
                  <th>የቦታው ደረጃ</th>
                  <th>የቦታ ስፋት</th>
                  <th class="green-cell">የይዞታ ማራጋገጫ</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </body>
        </html>
      `;

      // Open new print window
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      } else {
        showToast(
          "Failed to open print window. Please allow pop-ups.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Error printing records:",
        error.response?.status,
        error.response?.data,
        error.message
      );
      showToast(
        "Error fetching data for print. Please check the backend.",
        "error"
      );
    }
  };

  const styles = {
    container: {
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: "#f4f6f8",
      padding: "30px",
      maxWidth: "600px",
      margin: "40px auto",
      borderRadius: "12px",
      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
    },
    label: {
      fontSize: "1.2rem",
      fontWeight: "600",
      color: "#333",
      marginBottom: "10px",
    },
    select: {
      padding: "10px 14px",
      border: "1px solid #ccc",
      borderRadius: "6px",
      fontSize: "1rem",
      backgroundColor: "#fff",
      width: "150px", // Adjusted width
      marginBottom: "20px",
      transition: "border-color 0.3s ease",
    },
    buttonGroup: {
      display: "flex",
      justifyContent: "center",
      gap: "15px",
      marginTop: "20px",
    },
    button: {
      padding: "10px 20px",
      cursor: "pointer",
      backgroundColor: "#007bff",
      border: "none",
      color: "white",
      borderRadius: "6px",
      fontSize: "1rem",
      fontWeight: "600",
      transition: "background-color 0.3s, transform 0.2s, box-shadow 0.3s",
      boxShadow: "0 4px 12px rgba(0, 123, 255, 0.2)",
    },
    buttonHover: {
      backgroundColor: "#0056b3",
      transform: "translateY(-2px)",
      boxShadow: "0 6px 15px rgba(0, 86, 179, 0.3)",
    },
    modalOverlay: {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "1000",
    },
    modalContent: {
      background: "#fff",
      padding: "25px",
      width: "90%",
      maxWidth: "800px",
      borderRadius: "10px",
      position: "relative",
      overflowY: "auto",
      maxHeight: "90vh",
      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
      zIndex: "1001",
    },
    closeButton: {
      position: "absolute",
      top: "15px",
      right: "20px",
      background: "#dc3545",
      color: "white",
      border: "none",
      fontSize: "20px",
      borderRadius: "50%",
      width: "35px",
      height: "35px",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
    },
    previewTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "20px",
      backgroundColor: "white",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    },
    tableHeader: {
      backgroundColor: "#007bff",
      color: "white",
      fontWeight: "bold",
      padding: "12px 16px",
      textAlign: "left",
      fontSize: "1rem",
      border: "1px solid black",
    },
    tableCell: {
      border: "1px solid black",
      padding: "12px 16px",
      textAlign: "left",
      fontSize: "1rem",
    },
    lastColumnCell: {
      backgroundColor: "green", // Green background for last column
      color: "white",
      fontWeight: "bold",
      border: "1px solid black",
      padding: "12px 16px",
      textAlign: "left",
      fontSize: "1rem",
    },
    tableRowEven: {
      backgroundColor: "#f8f9fa",
    },
    reportHeader: {
      textAlign: "center",
      marginBottom: "20px",
      fontSize: "1.5rem",
      fontWeight: "bold",
      color: "#333",
    },
  };

  return (
    <div style={styles.container}>
      {/* ADDED: Toast Notification */}
      {toast.show && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            background: toast.type === "success" ? "#4BB543" : "#cc0000",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "6px",
            zIndex: 9999,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            fontWeight: "bold",
          }}
        >
          {toast.message}
        </div>
      )}

      <label style={styles.label}>የይዞታ ማራጋገጫ</label>
      <select
        name="proofOfPossession"
        value={selectedProof}
        onChange={(e) => setSelectedProof(e.target.value)}
        style={styles.select}
      >
        <option value="">Select</option>
        <option>ካርታ</option>
        <option>ሰነድ አልባ</option>
        <option>ህገ-ውፕ</option>
        <option>ምንም የሌለው</option>
      </select>
      <div style={styles.buttonGroup}>
        <button
          style={styles.button}
          onClick={handlePreview}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor =
              styles.buttonHover.backgroundColor)
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor =
              styles.button.backgroundColor)
          }
        >
          Preview
        </button>
        <button
          style={styles.button}
          onClick={handlePrint}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor =
              styles.buttonHover.backgroundColor)
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor =
              styles.button.backgroundColor)
          }
        >
          Print
        </button>
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button style={styles.closeButton} onClick={handleClose}>
              &times;
            </button>

            {/* Removed the printRef div from here. It's now dynamically generated in handlePrint */}
            <div style={styles.reportHeader}>
              <h2>የተመረጠው መረጃ</h2>
            </div>

            <table style={styles.previewTable}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>ተ.ቁ</th>
                  <th style={styles.tableHeader}>የይዞታው ባለቤት ስም</th>
                  <th style={styles.tableHeader}>UPIN</th>
                  <th style={styles.tableHeader}>ቀበሌ</th>
                  <th style={styles.tableHeader}>የቦታው ደረጃ</th>
                  <th style={styles.tableHeader}>የቦታ ስፋት</th>
                  <th style={styles.tableHeader}>የይዞታ ማረጋገጫ</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr
                    key={index}
                    style={
                      index % 2 === 0
                        ? styles.tableRowEven
                        : { backgroundColor: "white" }
                    }
                  >
                    <td style={styles.tableCell}>{index + 1}</td>
                    <td style={styles.tableCell}>{record.PropertyOwnerName}</td>
                    <td style={styles.tableCell}>{record.UPIN}</td>
                    <td style={styles.tableCell}>{record.kebele}</td>
                    <td style={styles.tableCell}>{record.placeLevel}</td>
                    <td style={styles.tableCell}>{record.spaceSize}</td>
                    <td style={styles.lastColumnCell}>
                      {record.proofOfPossession}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hidden printable content is now generated dynamically in handlePrint */}
      <div style={{ display: "none" }}>
        <div ref={printRef}>
          {/* Content for printRef is now generated dynamically in handlePrint */}
        </div>
      </div>
    </div>
  );
};

export default Report3;
