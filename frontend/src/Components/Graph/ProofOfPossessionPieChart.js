import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
// import axios from "axios"; // REMOVED: Use axiosInstance instead
import axiosInstance from "../../utils/axiosInstance"; // ADDED: Import axiosInstance

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const validProofs = ["ካርታ", "ሰነድ አልባ", "ህገ-ውፕ", "ምንም የሌለው"];

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

const ProofOfPossessionPieChart = () => {
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null); // State for error message

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // CHANGED: axios.get to axiosInstance.get
        const response = await axiosInstance.get(
          "http://localhost:8000/api/statistics/proof-of-possession"
        );
        const stats = response.data;
        const filtered = stats.filter((item) =>
          validProofs.includes(item.proofOfPossession)
        );
        const formatted = filtered.map((item) => ({
          name: item.proofOfPossession,
          value: item.count,
        }));
        setChartData(formatted);
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error("Error fetching Proof of Possession chart data:", error);
        setError(
          "Failed to load Proof of Possession data. Please check the backend."
        ); // Set user-friendly error
        setChartData([]); // Clear chart data on error
      }
    };

    fetchChartData();
  }, []);

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
        No data available for Proof of Possession chart.
      </div>
    );
  }

  return (
    <PieChart width={500} height={400}>
      <Pie
       data={chartData}
        cx="37%"
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
          display: "flex",
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

export default ProofOfPossessionPieChart;
