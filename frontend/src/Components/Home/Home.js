import React, { useState, useRef, useEffect } from "react";
import "./Home.css"; // For styling
import logo from "../../Images/logo.png"; // Assuming you still need this logo
// REMOVE: import axios from "axios";
import axiosInstance from "../../utils/axiosInstance"; // IMPORT THE NEW AXIOS INSTANCE
import { useNavigate, useLocation } from "react-router-dom";
import AddFile from "../AddFile/AddFile";
import EditFile from "../EditFile/EditFile";
import ViewFile from "../ViewFile/ViewFile";
import authService from "../../services/authService"; // No longer directly needed for headers here

const Home = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const formRef = useRef(null);
  const navigate = useNavigate();

  const [showAddFile, setShowAddFile] = useState(false);
  const [showEditFile, setshowEditFile] = useState(false);

  const [searchedRecord, setSearchedRecord] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);

  const location = useLocation();

  // No longer need to manually check isAuthenticated here, axiosInstance handles it
  // const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  useEffect(() => {
    // When path is '/', reset states to show home page
    if (location.pathname === "/") {
      setShowAddFile(false);
      setshowEditFile(false);
      setCurrentPage("home");
    }
  }, [location]);

  useEffect(() => {
    const fetchRecentRecords = async () => {
      // The authentication check is now handled by the axiosInstance interceptor
      try {
        const response = await axiosInstance.get(
          // Use axiosInstance
          `/records/recent/` // Use relative path
        );
        setRecentRecords(response.data);
      } catch (error) {
        console.error("Error fetching recent records:", error);
        // The interceptor should handle 401s, so direct logout logic here might be redundant
        // if (error.response && error.response.status === 401) {
        //     console.log("Unauthorized to fetch recent records, interceptor should handle.");
        // }
      }
    };

    fetchRecentRecords();
  }, []); // Removed isAuthenticated from dependencies, as interceptor handles auth

  const handleSearch = async () => {
    // The authentication check is now handled by the axiosInstance interceptor
    try {
      const response = await axiosInstance.get(
        // Use axiosInstance
        `/records/search/?UPIN=${searchQuery}` // Use relative path
      );
      if (response.data && response.data.length > 0) {
        setSearchedRecord(response.data[0]); // Assuming response is an array of matching records
      } else {
        setSearchedRecord(null); // Clear if no match
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchedRecord(null);
      // The interceptor should handle 401s
    } finally {
      setSearchQuery(""); // ✅ Reset the input field
    }
  };

  const handleRecordAdded = (newRecord) => {
    setSearchedRecord(newRecord); // Update the searchedRecord state
    // Re-fetch recent records after adding a new one
    // This will trigger fetchRecentRecords due to the empty dependency array
    // or you could call fetchRecentRecords() directly here if more granular control is desired.
  };

  const userGroups = authService.getCurrentUserGroups();
  const isSuperuser = authService.getIsSuperuser();
  const canEdit =
    isSuperuser || userGroups.includes("Editors") || userGroups.includes("Administrators");

  const renderContent = () => {
    if (showAddFile) {
      return <AddFile onRecordAdded={handleRecordAdded} />; // Pass the callback
    }
    if (showEditFile) {
      return <EditFile />;
    }
    switch (currentPage) {
      case "files":
        return <ViewFile />;

      case "home":
      default:
        return (
          <div ref={formRef}>
            <div className="top-actions">
              <button
                className="action-button"
                onClick={() => setShowAddFile(true)}
              >
                Add New File
              </button>
              {canEdit && (
                <button
                  className="action-button"
                  onClick={() => setshowEditFile(true)}
                >
                  Edit File
                </button>
              )}
             
            </div>
            {/* Table Below the Buttons */}
            <table className="data-table">
              <thead>
                <tr>
                  <th>የባለቤት ስም</th>
                  <th>የነባር የማህደር ኮድ</th>
                  <th>UPIN</th>
                  <th>የይዞታው አገልግሎት</th>
                  <th>የቦታው ደረጃ</th>
                  <th>ይዞታው የተገኘበት ሁኔታ</th>
                  <th>የቦታ ስፋት</th>
                  <th>ቀበሌ</th>
                  <th>የይዞታ ማረጋገጫ</th>
                  <th>እዳና እገዳ</th>
                </tr>
              </thead>
              <tbody>
                {/* Searched Record in First Row */}
                {searchedRecord && (
                  <tr key="searched">
                    <td>{searchedRecord.PropertyOwnerName}</td>
                    <td>{searchedRecord.ExistingArchiveCode}</td>
                    <td>{searchedRecord.UPIN}</td>
                    <td>{searchedRecord.ServiceOfEstate}</td>
                    <td>{searchedRecord.placeLevel}</td>
                    <td>{searchedRecord.possessionStatus}</td>
                    <td>{searchedRecord.spaceSize}</td>
                    <td>{searchedRecord.kebele}</td>
                    <td>{searchedRecord.proofOfPossession}</td>
                    <td>{searchedRecord.DebtRestriction}</td>
                  </tr>
                )}

                {/* Recent Records in Last Four Rows */}
                {recentRecords.map((record, index) => (
                  <tr key={`recent-${index}`}>
                    <td>{record.PropertyOwnerName}</td>
                    <td>{record.ExistingArchiveCode}</td>
                    <td>{record.UPIN}</td>
                    <td>{record.ServiceOfEstate}</td>
                    <td>{record.placeLevel}</td>
                    <td>{record.possessionStatus}</td>
                    <td>{record.spaceSize}</td>
                    <td>{record.kebele}</td>
                    <td>{record.proofOfPossession}</td>
                    <td>{record.DebtRestriction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };
  return renderContent();
};

export default Home;
