import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  CircularProgress,
  Alert,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import PeopleIcon from "@mui/icons-material/People";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import axiosInstance from "../../utils/axiosInstance";
import "./AdminDashboard.css";

const metrics = [
  {
    label: "Total Records",
    icon: <FolderIcon fontSize="large" />,
    color: "#1976d2",
    key: "totalRecords",
    description: "Count of all stored records/files",
  },
  {
    label: "Registered Users",
    icon: <PeopleIcon fontSize="large" />,
    color: "#388e3c",
    fontFamily: "Poppins, san-serif",
    key: "registeredUsers",
    description: "Total number of users",
  },

  {
    label: "Files Uploaded",
    icon: <CloudUploadIcon fontSize="large" />,
    color: "#d32f2f",
    key: "filesUploaded",
    description: "Total uploaded files this month",
  },
  {
    label: "Recently Active Users",
    icon: <VerifiedUserIcon fontSize="large" />,
    color: "#7b1fa2",
    fontFamily: "Poppins, san-serif",
    key: "recentActiveUsers",
    description: "Users who logged in in the past 7 days",
  },
];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("http://localhost:8000/api/dashboard-metrics/")
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // ...existing code...
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        mt={5}
        sx={{ fontFamily: "Poppins, sans-serif" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        mt={5}
        sx={{ fontFamily: "Poppins, sans-serif" }}
      >
        <Alert severity="error" sx={{ fontFamily: "Poppins, sans-serif" }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        fontWeight="bold"
        color="primary.dark"
        sx={{
          mb: 4,
          fontFamily: "Poppins, sans-serif",
          marginTop: "20px",
          marginBottom: "40px",
        }}
      >
        Admin Dashboard
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {metrics.map((metric) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={metric.key}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: 6,
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.04)" },
                background: "#fff",
                fontFamily: "Poppins, sans-serif",
                minHeight: 170,
              }}
            >
              <CardContent sx={{ fontFamily: "Poppins, sans-serif" }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      bgcolor: metric.color,
                      mr: 2,
                      width: 64,
                      height: 64,
                      fontFamily: "Poppins, sans-serif",
                    }}
                  >
                    {metric.icon}
                  </Avatar>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {metric.label}
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  color={metric.color}
                  sx={{ mb: 1, fontFamily: "Poppins, sans-serif" }}
                >
                  {data[metric.key] ?? "--"}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {metric.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
  // ...existing code...
};

export default AdminDashboard;
