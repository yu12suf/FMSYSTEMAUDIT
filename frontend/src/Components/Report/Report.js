import React, { useState } from "react";
import "./Report.css"; // For styling
import Report3 from "./Report3";
import Report1 from "./Report1";
import Report2 from "./Report2";
import Report4 from "./Report4";
import Report5 from "./Report5";
import Report6 from "./Report6";

const Report = ({ title, kebele, content }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="report-item">
      <button className="report-button" onClick={toggleOpen}>
        <span>{title}</span>
        <span className="kebele-label">{kebele}</span>
      </button>
      {isOpen && <div className="report-content">{content}</div>}
    </div>
  );
};

const App = () => {
  const reports = [
    {
      title: "የይዞታው አገልግሎት",
      content: <Report1 />,
    },
    {
      title: "የነባር ይዞታ ግብር ያልከፈሉ ባለይዞታዎች",
      kebele: "19 kebele",
      content: <Report2 />,
    },
    {
      title: "የይዞታ ማረጋገጫ",
      content: <Report3 />,
    },
    {
      title: "የሊዝ ይዞታ ግብር ያልከፈሉ ባለይዞታዎች",
      kebele: "19 kebele",
      content: <Report4 />,
    },
    {
      title: "ይዞታው የተገኘበት ሁኔታ",
      content: <Report5 />,
    },
    {
      title: "የቋሚ ንብረት ግብር ያልከፈሉ ባልይዞታዎች",
      kebele: "19 kebele",
      content: <Report6 />,
    },
  ];

  return (
    <div className="app">
      <h1>Reports</h1>
      {reports.map((report, index) => (
        <Report
          key={index}
          title={report.title}
          kebele={report.kebele}
          content={report.content}
        />
      ))}
    </div>
  );
};

export default App;
