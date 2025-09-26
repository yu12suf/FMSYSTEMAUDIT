import React, { useState, useRef, useEffect } from "react";
import "./AddFile.css";
import axiosInstance from "../../utils/axiosInstance"; // Correctly import axiosInstance
import { useNavigate, useLocation } from "react-router-dom";
import TaxForm from "../TaxForm/TaxForm";
import FileUploader from "../FileUploader/FileUploader";
import authService from "../../services/authService"; // Keep authService for isAuthenticated check and logout

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

const REQUIRED_FILES = [
  "የይዞታ ማረጋገጫ ፋይል",
  "ሊዝ የተከፈለበት ደረሰኝ ፋይል",
  "የንብረት ግብር ደረሰኝ ፋይል",
  "የግብር ደረሰኝ ፋይል",
];

const FORM_DATA_KEY = "addFileFormData";

function AddFile({ onRecordAdded }) {
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef(null);

  // State
  const [records, setRecords] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [searchResults, setSearchResults] = useState([]); // Still needed for navigation context check
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1); // Still needed for navigation context check
  const [searchQuery, setSearchQuery] = useState(""); // Still needed for URL param handling
  const [navigationContext, setNavigationContext] = useState("search");
  const [editIndex, setEditIndex] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editUpin, setEditUpin] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [upinCheckLoading, setUpinCheckLoading] = useState(false);
  const [upinExists, setUpinExists] = useState(false);
  const upinCheckTimeout = useRef(null);
  const [searchError, setSearchError] = useState(""); // Still needed for URL param handling

  // State for files
  const [requiredFiles, setRequiredFiles] = useState(
    REQUIRED_FILES.map((name) => ({
      name,
      file: null,
      url: null,
      type: "",
      date: "",
      originalName: "",
    }))
  );
  const [files, setFiles] = useState([]); // additional files

  // State for file uploader modal visibility
  const [showFileUploaderModal, setShowFileUploaderModal] = useState(false);

  const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem(FORM_DATA_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          PropertyOwnerName: "",
          ExistingArchiveCode: "",
          UPIN: "",
          PhoneNumber: "",
          NationalId: "",
          ServiceOfEstate: "",
          placeLevel: "",
          possessionStatus: "",
          spaceSize: "",
          kebele: "",
          proofOfPossession: "",
          DebtRestriction: "",
          LastTaxPaymtDate: "",
          unpaidTaxDebt: "",
          InvoiceNumber: "",
          FirstAmount: "",
          lastDatePayPropTax: "",
          unpaidPropTaxDebt: "",
          InvoiceNumber2: "",
          SecondAmount: "",
          EndLeasePayPeriod: "",
          unpaidLeaseDebt: "",
          InvoiceNumber3: "",
          ThirdAmount: "",
          FolderNumber: "",
          Row: "",
          ShelfNumber: "",
          NumberOfPages: 0,
          sortingNumber: "",
        };
  });

  //new use effect added

  useEffect(() => {
  const handler = () => setShowFileUploaderModal(false);
  window.addEventListener("closeFileUploaderModal", handler);
  return () => window.removeEventListener("closeFileUploaderModal", handler);
}, []);

  // Save formData to sessionStorage on change (not files)
  useEffect(() => {
    sessionStorage.setItem(FORM_DATA_KEY, JSON.stringify(formData));
  }, [formData]);

  // Fetch records from backend
  const fetchRecords = async () => {
    try {
      // Use axiosInstance for fetching records
      const response = await axiosInstance.get("/records/");
      setRecords(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setRecords([]);
      showToast("Failed to fetch records. Please try again.", "error");
      console.error("Error fetching records:", error);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Populate form when navigating records
  useEffect(() => {
    if (
      navigationContext === "edit" &&
      editIndex !== null &&
      records[editIndex]
    ) {
      populateFormWithRecord(records[editIndex]);
    }
    // eslint-disable-next-line
  }, [editIndex]);

  useEffect(() => {
    if (
      navigationContext === "search" &&
      currentSearchIndex >= 0 &&
      searchResults[currentSearchIndex]
    ) {
      populateFormWithRecord(searchResults[currentSearchIndex]);
    }
    // eslint-disable-next-line
  }, [currentSearchIndex]);

  // Handle URL query params for edit mode
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const upinFromUrl = params.get("upin");
    const isEditMode = params.get("editMode") === "true";

    if (isEditMode && upinFromUrl) {
      setSearchQuery(upinFromUrl); // Set the search query input
      // Trigger the search automatically
      const fetchRecordForEdit = async () => {
        try {
          const response = await axiosInstance.get(
            `/records/?UPIN=${upinFromUrl}`
          );
          if (response.data && response.data.length > 0) {
            setSearchResults(response.data);
            setCurrentSearchIndex(0);
            const record = response.data[0];
            setFormData({
              UPIN: record.UPIN,
              PropertyOwnerName: record.PropertyOwnerName,
              ExistingArchiveCode: record.ExistingArchiveCode,
              PhoneNumber: record.PhoneNumber,
              NationalId: record.NationalId,
              ServiceOfEstate: record.ServiceOfEstate,
              placeLevel: record.placeLevel,
              possessionStatus: record.possessionStatus,
              spaceSize: record.spaceSize,
              kebele: record.kebele,
              proofOfPossession: record.proofOfPossession,
              DebtRestriction: record.DebtRestriction,
              LastTaxPaymtDate: record.LastTaxPaymtDate,
              unpaidTaxDebt: record.unpaidTaxDebt,
              InvoiceNumber: record.InvoiceNumber,
              FirstAmount: record.FirstAmount,
              lastDatePayPropTax: record.lastDatePayPropTax,
              unpaidPropTaxDebt: record.unpaidPropTaxDebt,
              InvoiceNumber2: record.InvoiceNumber2,
              SecondAmount: record.SecondAmount,
              EndLeasePayPeriod: record.EndLeasePayPeriod,
              unpaidLeaseDebt: record.unpaidLeaseDebt,
              InvoiceNumber3: record.InvoiceNumber3,
              ThirdAmount: record.ThirdAmount,
              FolderNumber: record.FolderNumber,
              Row: record.Row,
              ShelfNumber: record.ShelfNumber,
              NumberOfPages: record.NumberOfPages,
              sortingNumber: record.sortingNumber,
            });

            // Re-initialize required files based on fetched data
            const updatedRequiredFiles = REQUIRED_FILES.map((name) => {
              const foundFile = record.files?.find((f) => f.category === name); // Assuming 'files' is the field name from your serializer
              return {
                name,
                file: null, // Actual File object not retained from backend
                url: foundFile ? foundFile.uploaded_file : null, // URL for viewing
                type: foundFile ? foundFile.type : "",
                date: foundFile ? foundFile.uploaded_at : "",
                originalName: foundFile ? foundFile.display_name : "",
                id: foundFile ? foundFile.id : null, // Store file ID for replace/delete
              };
            });
            setRequiredFiles(updatedRequiredFiles);

            // Set additional files from fetched record
            const fetchedAdditionalFiles =
              record.files?.filter(
                (f) => !REQUIRED_FILES.includes(f.category)
              ) || [];
            setFiles(
              fetchedAdditionalFiles.map((f) => ({
                file: null, // Not a new file object
                name: f.display_name,
                category: f.category,
                id: f.id,
                uploaded_file: f.uploaded_file, // URL for viewing
              }))
            );

            setEditMode(true);
            setEditUpin(upinFromUrl);
            showToast(`Record loaded for editing: ${upinFromUrl}`);
          } else {
            showToast("Record not found for editing.", "error");
            setEditMode(false);
            setEditUpin(null);
            navigate("/addfile", { replace: true }); // Clear URL params
          }
        } catch (error) {
          console.error("Error fetching record for edit:", error);
          showToast("Error loading record for editing.", "error");
          setEditMode(false);
          setEditUpin(null);
          navigate("/addfile", { replace: true }); // Clear URL params
        }
      };
      fetchRecordForEdit();
    } else if (!isEditMode && editMode) {
      // If was in edit mode but URL params removed
      resetForm();
    }
  }, [location.search, navigate]); // Depend on location.search and navigate

  // Toast handler
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      2500
    );
  };

  // Validation helpers
  const validateRequiredFields = () => {
    let errors = {};
    for (const field of REQUIRED_FIELDS) {
      if (
        formData[field] === undefined ||
        formData[field] === null ||
        formData[field].toString().trim() === ""
      ) {
        errors[field] = "This field is required.";
      }
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      showToast(
        "All required fields must be completed before submitting the form.",
        "error"
      );
      return false;
    }
    return true;
  };

  // Validate that all required files are uploaded
  const validateFileUpload = () => {
    const missing = requiredFiles.some((f) => !f.file && !f.url); // Check if file is missing AND not already uploaded
    if (missing) {
      showToast(
        "All required files must be uploaded before you can submit.",
        "error"
      );
      return false;
    }
    return true;
  };

  function validateFaydaNumber(value) {
    // Ethiopian Fayda Number: 12 digits, all numbers
    return /^\d{12}$/.test(value.trim());
  }

  // Form field change handler
  const handleChange = (event) => {
    const { name, value } = event.target;

    // Required field validation (real-time)
    if (REQUIRED_FIELDS.includes(name)) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: value.trim() === "" ? "This field is required." : "",
      }));
    }

    // Inline validation for PropertyOwnerName
    if (name === "PropertyOwnerName") {
      const characterOnlyRegex = /^[A-Za-z\u1200-\u135A\s]*$/;
      setFormErrors((prev) => ({
        ...prev,
        PropertyOwnerName: characterOnlyRegex.test(value)
          ? ""
          : "Please enter only valid Amharic or English characters.",
      }));
    }
    // Inline validation for NationalId (Fayda Number)
    if (name === "NationalId") {
      setFormErrors((prev) => ({
        ...prev,
        NationalId:
          value.trim() === ""
            ? "This field is required."
            : validateFaydaNumber(value)
            ? ""
            : "Invalid Fayda Number. It must be a 12-digit number.",
      }));
    }

    // Real-time UPIN duplicate check (debounced)
    if (name === "UPIN") {
      setFormErrors((prev) => ({
        ...prev,
        UPIN: value.trim() === "" ? "This field is required." : "",
      }));
      setUpinExists(false);
      if (upinCheckTimeout.current) clearTimeout(upinCheckTimeout.current);
      upinCheckTimeout.current = setTimeout(() => {
        // Only check if UPIN is different from current editUpin
        if (editMode && value === editUpin) {
          setUpinExists(false); // It's the same UPIN, so not a duplicate
          setUpinCheckLoading(false);
          return;
        }
        checkUPINExists(value);
      }, 400);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "NumberOfPages" ? Number(value) : value,
    }));
  };

  // Name field blur validation
  const handleBlurName = (event) => {
    const { name, value } = event.target;
    if (name === "PropertyOwnerName") {
      const characterOnlyRegex = /^[A-Za-z\u1200-\u135A\s]*$/;
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        PropertyOwnerName: characterOnlyRegex.test(value)
          ? ""
          : "Please enter only valid Amharic or English characters.",
      }));
    }
  };

  // Year/debt validation
  const calculateUnpaidDebt = (year) => {
    const parsed = parseInt(year, 10);
    // Ethiopian year is roughly Gregorian year - 8. Let's use current Gregorian year for calculation reference.
    const currentGregorianYear = new Date().getFullYear();
    const currentEthiopianYearApprox = currentGregorianYear - 8; // Approximation

    if (
      !isNaN(parsed) &&
      parsed >= 1950 &&
      parsed <= currentEthiopianYearApprox
    ) {
      return currentEthiopianYearApprox - parsed;
    }
    return null; // Return null for invalid or future years
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const parsed = parseInt(value, 10);
    const currentGregorianYear = new Date().getFullYear();
    const currentEthiopianYearApprox = currentGregorianYear - 8;

    if (
      !value ||
      isNaN(parsed) ||
      parsed < 1950 ||
      parsed > currentEthiopianYearApprox
    ) {
      showToast(
        `Please enter a year between 1950 and ${currentEthiopianYearApprox}.`,
        "error"
      );
      setFormData((prev) => {
        const updated = { ...prev, [name]: "" };
        if (name === "LastTaxPaymtDate") updated.unpaidTaxDebt = "";
        else if (name === "lastDatePayPropTax") updated.unpaidPropTaxDebt = "";
        else if (name === "EndLeasePayPeriod") updated.unpaidLeaseDebt = "";
        return updated;
      });
      return;
    }

    const unpaid = calculateUnpaidDebt(value);
    setFormData((prev) => {
      const updates = { [name]: value };
      if (name === "LastTaxPaymtDate") updates.unpaidTaxDebt = unpaid;
      else if (name === "lastDatePayPropTax")
        updates.unpaidPropTaxDebt = unpaid;
      else if (name === "EndLeasePayPeriod") updates.unpaidLeaseDebt = unpaid;
      return { ...prev, ...updates };
    });
  };

  // Populate form with a record
  const populateFormWithRecord = (record) => {
    if (!record) return;
    setFormData(record);
    setEditMode(true);
    setEditUpin(record.UPIN);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      PropertyOwnerName: "",
      ExistingArchiveCode: "",
      UPIN: "",
      PhoneNumber: "",
      NationalId: "",
      ServiceOfEstate: "",
      placeLevel: "",
      possessionStatus: "",
      spaceSize: "",
      kebele: "",
      proofOfPossession: "",
      DebtRestriction: "",
      LastTaxPaymtDate: "",
      unpaidTaxDebt: "",
      InvoiceNumber: "",
      FirstAmount: "",
      lastDatePayPropTax: "",
      unpaidPropTaxDebt: "",
      InvoiceNumber2: "",
      SecondAmount: "",
      EndLeasePayPeriod: "",
      unpaidLeaseDebt: "",
      InvoiceNumber3: "",
      ThirdAmount: "",
      FolderNumber: "",
      Row: "",
      ShelfNumber: "",
      NumberOfPages: 0, // Ensure it's a number
      sortingNumber: "",
    });
    setRequiredFiles(
      REQUIRED_FILES.map((name) => ({
        name,
        file: null,
        url: null,
        type: "",
        date: "",
        originalName: "",
      }))
    );
    setFiles([]);
    setFormErrors({});
    setSearchError(""); // Clear search error
    setEditMode(false);
    setEditUpin(null);
    setEditIndex(null);
    setCurrentSearchIndex(-1);
    setSearchResults([]);
    sessionStorage.removeItem(FORM_DATA_KEY);
    window.dispatchEvent(new Event("fileUploader:reset")); // Trigger reset in FileUploader
  };

  // --- Main form submission handler (Add Record) ---
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (Object.values(formErrors).some((msg) => msg) || upinExists) {
      showToast(
        upinExists
          ? "A record with this UPIN already exists. Please use a unique UPIN."
          : "Please fill in all required fields and resolve errors.",
        "error"
      );
      return;
    }

    if (!validateRequiredFields()) return;
    if (!validateFileUpload()) return;

    const updatedData = {
      ...formData,
      unpaidTaxDebt: calculateUnpaidDebt(formData.LastTaxPaymtDate),
      unpaidPropTaxDebt: calculateUnpaidDebt(formData.lastDatePayPropTax),
      unpaidLeaseDebt: calculateUnpaidDebt(formData.EndLeasePayPeriod),
    };

    // Build FormData
    const formDataToSend = new FormData();
    Object.entries(updatedData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });

    // Add required files
    requiredFiles.forEach((fileObj) => {
      if (fileObj.file) {
        formDataToSend.append("files", fileObj.file);
        formDataToSend.append("names[]", fileObj.name);
        formDataToSend.append("categories[]", "required");
      }
    });

    // Add additional files
    files.forEach((fileObj) => {
      if (fileObj.file) {
        formDataToSend.append("files", fileObj.file);
        formDataToSend.append("names[]", fileObj.name);
        formDataToSend.append("categories[]", "additional");
      }
    });

    try {
      const response = await axiosInstance.post("/records/", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        const newRecord = response.data;
        resetForm();
        showToast("Record added successfully!", "success");

        if (typeof onRecordAdded === "function") {
          onRecordAdded(newRecord);
        }
      } else {
        showToast(
          `Failed to add record: ${JSON.stringify(response.data)}`,
          "error"
        );
      }
    } catch (error) {
      showToast("An error occurred while saving the record.", "error");
    }
  };

  // Save (edit) handler
  const handleSaveClick = async () => {
    if (
      Object.values(formErrors).some((msg) => msg) ||
      (upinExists && formData.UPIN !== editUpin)
    ) {
      showToast(
        upinExists && formData.UPIN !== editUpin
          ? "A record with this UPIN already exists. Please use a unique UPIN."
          : "Please fill in all required fields and resolve errors.",
        "error"
      );
      return;
    }

    if (!validateRequiredFields()) return;
    if (!validateFileUpload()) return;

    const updatedData = {
      ...formData,
      unpaidTaxDebt: calculateUnpaidDebt(formData.LastTaxPaymtDate),
      unpaidPropTaxDebt: calculateUnpaidDebt(formData.lastDatePayPropTax),
      unpaidLeaseDebt: calculateUnpaidDebt(formData.EndLeasePayPeriod),
    };

    try {
      const formDataToSend = new FormData();
      Object.entries(updatedData).forEach(([key, value]) => {
        if (typeof value !== "object" || value === null) {
          formDataToSend.append(key, value);
        }
      });

      requiredFiles.forEach((fileObj) => {
        if (fileObj.file) {
          formDataToSend.append("files", fileObj.file);
          formDataToSend.append("names[]", fileObj.name);
          formDataToSend.append("categories[]", "required");
        }
      });

      files.forEach((fileObj) => {
        if (fileObj.file) {
          formDataToSend.append("files", fileObj.file);
          formDataToSend.append("names[]", fileObj.name);
          formDataToSend.append("categories[]", "additional");
        }
      });

      // Use the correct endpoint for updating by UPIN
      const response = await axiosInstance.put(
        `/records/${editUpin}/`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        await fetchRecords();
        resetForm();
        setEditMode(false);
        setEditUpin(null);
        setSearchResults([]);
        setCurrentSearchIndex(0);
        showToast("Record updated successfully!", "success");
        if (typeof onRecordAdded === "function") {
          onRecordAdded(response.data);
        }
        navigate("/files");
      } else {
        showToast(
          `Failed to update record: ${JSON.stringify(response.data)}`,
          "error"
        );
      }
    } catch (error) {
      showToast("An error occurred while updating the record.", "error");
    }
  };

  // --- Real-time UPIN duplicate check ---
  const checkUPINExists = async (upin) => {
    if (!upin || upin.trim() === "") {
      setUpinExists(false);
      return;
    }
    setUpinCheckLoading(true);
    try {
      // Use axiosInstance for UPIN existence check
      const response = await axiosInstance.get(
        `/records/check-upin/${encodeURIComponent(upin.trim())}/`
      );
      // The backend should return { exists: true/false }
      setUpinExists(response.data.exists);
    } catch (error) {
      console.error("Error checking UPIN existence:", error);
      // If there's an error (e.g., 404 for not found, or network issue), assume it doesn't exist for now
      setUpinExists(false);
    } finally {
      setUpinCheckLoading(false);
    }
  };

  //validating Phone Number
  const validatePhoneNumber = () => {
    const phone = formData.PhoneNumber.trim();
    const ethiopianPhoneRegex = /^(?:\+251|0)(7\d{8}|9\d{8})$/;

    if (phone === "") {
      // Clear the error when the field is empty
      setFormErrors((prev) => ({
        ...prev,
        PhoneNumber: "",
      }));
    } else if (!ethiopianPhoneRegex.test(phone)) {
      setFormErrors((prev) => ({
        ...prev,
        PhoneNumber:
          "Invalid phone number. Use +2519XXXXXXXX, +2517XXXXXXXX, 09XXXXXXXX, or 07XXXXXXXX format.",
      }));
      setFormData((prev) => ({
        ...prev,
        PhoneNumber: "", // Clear the invalid input
      }));
    } else {
      setFormErrors((prev) => ({
        ...prev,
        PhoneNumber: "",
      }));
    }
  };

  // --- Render ---
  return (
    <div ref={formRef} className="add-file-container">
      {/* Toast Notification */}
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
      <h2>{!editMode ? "Add New Record" : "Edit Record"}</h2>
      {/* Removed Search Section */}
      {/* The search section was removed as per user request */}

      <form
        className="form"
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            e.target.tagName !== "TEXTAREA" &&
            e.target.type !== "submit"
          ) {
            e.preventDefault();
          }
        }}
        aria-label="Add Record Form"
      >
        <div className="form-columns-wrapper">
          <div className="form-column-1">
            <div className="form-group" style={{ position: "relative" }}>
              <label>ይዞታው ባለቤት ስም</label>
              <input
                type="text"
                name="PropertyOwnerName"
                value={formData.PropertyOwnerName}
                onChange={handleChange}
                onBlur={handleBlurName}
              />
              {formErrors.PropertyOwnerName && (
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
                  {formErrors.PropertyOwnerName}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>የነባር የማህደር ኮደ</label>
              <input
                type="text"
                name="ExistingArchiveCode"
                value={formData.ExistingArchiveCode}
                onChange={handleChange}
              />
            </div>
            <div className="form-group" style={{ position: "relative" }}>
              <label>UPIN</label>
              <input
                type="text"
                name="UPIN"
                value={formData.UPIN}
                onChange={handleChange}
                disabled={editMode}
                autoComplete="off"
              />
              {upinCheckLoading && (
                <div
                  style={{
                    color: "#888",
                    fontSize: "0.85em",
                    marginTop: "2px",
                  }}
                >
                  Checking UPIN...
                </div>
              )}
              {formErrors.UPIN && (
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
              {upinExists && !formErrors.UPIN && (
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
                  A record with this UPIN already exists. Please use a unique
                  UPIN.
                </div>
              )}
            </div>

            <div className="form-group" style={{ position: "relative" }}>
              <label>ስልክ ቁጥር</label>
              <input
                type="text"
                name="PhoneNumber"
                value={formData.PhoneNumber}
                onChange={handleChange}
                onBlur={validatePhoneNumber}
              />
              {formErrors.PhoneNumber && (
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
                  {formErrors.PhoneNumber}
                </div>
              )}
            </div>

            <div className="form-group" style={{ position: "relative" }}>
              <label>Fayda Number</label>
              <input
                type="text"
                name="NationalId"
                value={formData.NationalId}
                onChange={handleChange}
              />
              {formErrors.NationalId && (
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
                  {formErrors.NationalId}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>የይዞታ አገልግሎት</label>
              <select
                name="ServiceOfEstate"
                value={formData.ServiceOfEstate}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option>ለመኖረያ</option>
                <option>ለንግድ</option>
                <option>የመንግስት</option>
                <option>የሐይማኖት ተቋም</option>
                <option>ኢንቨስትመንት</option>
                <option>የቀበሌ</option>
                <option>የኪይ ቤቶች</option>
                <option>ኮንዲኒሚየም</option>
                <option>መንገድ</option>
                <option>የማሃበር</option>
                <option>ሌሎች</option>
              </select>
            </div>
            <div className="form-group">
              <label>የቦታው ደረጃ</label>
              <select
                name="placeLevel"
                value={formData.placeLevel}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option>1ኛ</option>
                <option>2ኛ</option>
                <option>3ኛ</option>
                <option>4ኛ</option>
              </select>
            </div>
            <div className="form-group">
              <label>የይዞታየተገኘበት ሁኔታ</label>
              <select
                name="possessionStatus"
                value={formData.possessionStatus}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option>ነባር</option>
                <option>ሊዝ</option>
              </select>
            </div>
            <div className="form-group">
              <label>የቦታ ስፋት</label>
              <input
                type="number"
                name="spaceSize"
                value={formData.spaceSize}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label>ቀበሌ</label>
              <select
                name="kebele"
                value={formData.kebele}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option>01</option>
                <option>02</option>
                <option>03</option>
                <option>04</option>
                <option>05</option>
                <option>06</option>
                <option>07</option>
                <option>08</option>
                <option>09</option>
                <option>10</option>
                <option>11</option>
                <option>12</option>
                <option>13</option>
                <option>14</option>
                <option>15</option>
                <option>16</option>
                <option>17</option>
                <option>18</option>
                <option>19</option>
              </select>
            </div>
          </div>
          <div className="form-column-2">
            <div className="form-group">
              <label>የይዞታ ማራጋገጫ</label>
              <select
                name="proofOfPossession"
                value={formData.proofOfPossession}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option>ካርታ</option>
                <option>ሰነድ አልባ</option>
                <option>ህገ-ውፕ</option>
                <option>ምንም የሌለው</option>
              </select>
            </div>
            <div className="form-group">
              <label>እዳና እገዳ</label>
              <select
                name="DebtRestriction"
                value={formData.DebtRestriction}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option>እዳ</option>
                <option>እገዳ</option>
                <option>ነፃ</option>
              </select>
            </div>

            <div className="form-group">
              <label className="year-label">የግብር የመጨረሻ የተከፈለበት ዘመን</label>
              <input
                type="text"
                name="LastTaxPaymtDate"
                value={formData.LastTaxPaymtDate}
                onChange={handleChange}
                onBlur={handleBlur} // alert triggers on blur
                min="1950"
                max={new Date().getFullYear() - 8}
                placeholder="e.g., 2015"
              />

              <TaxForm debt={formData.unpaidTaxDebt} />
            </div>

            <div className="form-group">
              <label>ደረሰኝ ቁጥር</label>
              <input
                type="number"
                name="InvoiceNumber"
                value={formData.InvoiceNumber}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>የግብር የተከፈለዉ መጠን</label>
              <input
                type="number"
                name="FirstAmount"
                value={formData.FirstAmount}
                onChange={handleChange}
              />
            </div>
            <div className="form-group tax-pay">
              <label className="year-label">የንብረት ግብር የመጨረሻ የተከፈለበት ዘመን</label>
              <input
                type="text"
                name="lastDatePayPropTax"
                value={formData.lastDatePayPropTax}
                onChange={handleChange}
                onBlur={handleBlur} //  alert triggers on blur
                min="1950"
                max={new Date().getFullYear() - 8}
                placeholder="e.g., 2015"
              />

              <TaxForm debt={formData.unpaidPropTaxDebt} />
            </div>
            <div className="form-group">
              <label>ደረሰኝ ቁጥር</label>
              <input
                type="number"
                name="InvoiceNumber2"
                value={formData.InvoiceNumber2}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>የንብረት የተከፈለዉ መጠን</label>
              <input
                type="number"
                name="SecondAmount"
                value={formData.SecondAmount}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-column-3">
            <div className="form-group last-year">
              <label>የሊዝ መጨረሻ የተከፈለበት ዘመን</label>
              <input
                type="text"
                name="EndLeasePayPeriod"
                value={formData.EndLeasePayPeriod}
                onChange={handleChange}
                onBlur={handleBlur} //  alert triggers on blur
                min="1950"
                max={new Date().getFullYear() - 8}
                placeholder="e.g., 2015"
              />
              <TaxForm debt={formData.unpaidLeaseDebt} />
            </div>
            <div className="form-group">
              <label>ደረሰኝ ቁጥር</label>
              <input
                type="number"
                name="InvoiceNumber3"
                value={formData.InvoiceNumber3}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>የሊዝ የተከፈለዉ መጠን</label>
              <input
                type="number"
                name="ThirdAmount"
                value={formData.ThirdAmount}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>አቃፊ ቁጥር</label>
              <input
                type="number"
                name="FolderNumber"
                value={formData.FolderNumber}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>ሮዉ</label>
              <input
                type="text"
                name="Row"
                value={formData.Row}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>የሼልፍ ቁጥር</label>
              <input
                type="number"
                name="ShelfNumber"
                value={formData.ShelfNumber}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>የስነድ የገፅ ብዛት</label>
              <input
                type="number"
                name="NumberOfPages"
                value={formData.NumberOfPages}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>መደርደረያ ቁፕር</label>
              <input
                type="number"
                name="sortingNumber"
                value={formData.sortingNumber}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* --- Removed the inline File Uploader Section --- */}
        {/* The FileUploader component is now rendered inside the modal */}

        {/* --- Action Buttons --- */}
        <div className="button-container-1">
          {!editMode ? (
            <button type="submit" className="submit-button-1">
              Add Record
            </button>
          ) : (
            <button
              type="button"
              className="submit-button-1"
              onClick={() => {
                handleSaveClick();
                setEditMode(false);
                setEditUpin(null);
                if (navigationContext === "edit") {
                  setSearchResults([]);
                  setCurrentSearchIndex(0);
                }
              }}
            >
              Save
            </button>
          )}
          {/* New button to open the File Uploader Modal */}
          <button
            type="button"
            className="submit-button-1"
            onClick={() => setShowFileUploaderModal(true)}
          >
            Upload Files
          </button>
          <button type="button" className="submit-button-1" onClick={resetForm}>
            Clear
          </button>
        </div>
      </form>

      {/* File summary */}
      <div></div>

      {/* File Uploader Modal */}
      {showFileUploaderModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "10px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              position: "relative",
              width: "90%", // Adjust width as needed
              maxWidth: "800px", // Max width for larger screens
              maxHeight: "90vh", // Max height to prevent overflow
              overflowY: "auto", // Enable scrolling if content is too long
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* Changed 'x' button to 'Add' button */}
            <button
              className="close-modal-btn"
              onClick={() => setShowFileUploaderModal(false)}
              style={{
                background: "transparent",
                color: "#333",
                border: "none",
                fontSize: "2rem",
                fontWeight: "bold",
                position: "absolute",
                top: "18px",
                right: "18px",
                cursor: "pointer",
                zIndex: 10,
                lineHeight: 1,
              }}
              aria-label="Close"
            >
              &times;
            </button>
            <h3>File Uploads</h3>
            <FileUploader
              requiredFiles={requiredFiles}
              setRequiredFiles={setRequiredFiles}
              files={files}
              setFiles={setFiles}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AddFile;
