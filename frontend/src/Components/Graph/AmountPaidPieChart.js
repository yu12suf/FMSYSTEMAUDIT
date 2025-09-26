import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import axiosInstance from "../../utils/axiosInstance";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0 ? (
    <text
      x={x}
      y={y}
      fill="black"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: "14px", fontWeight: "bold" }}
    >
      {(percent * 100).toFixed(1)}%
    </text>
  ) : null;
};

const AmountPaidPieChart = () => {
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);

  // ...existing code...
useEffect(() => {
  const fetchChartData = async () => {
    try {
      const response = await axiosInstance.get("http://localhost:8000/api/statistics/amount-paid");
      const data = response.data;

      // Use backend counts directly
      setChartData([
        { name: "የግብር መጠን", value: data[0].count },
        { name: "የንብረት ግብር መጠን", value: data[1].count },
        { name: "የሊዝ ግብር መጠን", value: data[2].count },
      ]);
      setError(null);
    } catch (error) {
      setError("Failed to load payment data. Please check the backend.");
      setChartData([]);
    }
  };

  fetchChartData();
}, []);
// ...existing code...

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (error) {
    return (
      <div style={{ color: "red", textAlign: "center", padding: "20px" }}>
        {error}
      </div>
    );
  }

  if (chartData.length === 0 && !error) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        No data available for Amount Paid chart.
      </div>
    );
  }

  return (
    <PieChart width={500} height={400}>
      <Pie
        data={chartData}
        cx="36%"
        cy="50%"
        labelLine={false}
        label={renderCustomizedLabel}
        outerRadius={150}
        fill="#8884d8"
        dataKey="value"
      >
        {chartData.map((_, index) => (
          <Cell
            key={`cell-${index}`}
            fill={COLORS[index % COLORS.length]}
            style={{ cursor: "pointer" }}
          />
        ))}
      </Pie>
      <Tooltip
        formatter={(value) =>
          `${((value / total) * 100).toFixed(1)}% (${value})`
        }
        contentStyle={{
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          fontSize: "14px",
          fontWeight: "500",
        }}
      />
      <Legend
        wrapperStyle={{
          display: "inline-flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginTop: "20px",
          fontSize: "14px",
          fontWeight: "500",
          color: "#333",
          
        }}
      />
    </PieChart>
  );
};

export default AmountPaidPieChart;