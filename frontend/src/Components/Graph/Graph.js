import React from "react";
import ServiceOfEstatePieChart from "./ServiceOfEstatePieChart";
import ProofOfPossessionPieChart from "./ProofOfPossessionPieChart";
import AmountPaidPieChart from "./AmountPaidPieChart"; // <-- Add this import
import "./Graph.css";

const Graph = () => {
  return (
    <div>
      <div className="graph-container">
        {/* Render Graph1 */}
        <div className="graph-1">
          <h2>የይዞታው አገልግሎት ግራፍ</h2>
          <ServiceOfEstatePieChart />
        </div>

        {/* Render Graph2 */}
        <div className="graph-2">
          <h2>የይዞታ ማረጋገጫ ግራፍ</h2>
          <ProofOfPossessionPieChart />
        </div>

         {/* Render Amount Paid Pie Chart */}
        <div className="graph-3">
          <h2>የተከፈሉ መጠን ግራፍ</h2>
          <AmountPaidPieChart />
        </div>
       
      </div>
    </div>
  );
};

export default Graph;
