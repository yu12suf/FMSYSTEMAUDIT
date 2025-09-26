import React from "react";
import "./TaxForm.css";

const TaxForm = ({ debt }) => {
  return (
    <table className="tax-form-table">
      <thead>
        <tr>
          <th>ውዝፍ</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{debt}</td>
        </tr>
      </tbody>
    </table>
  );
};

export default TaxForm;
