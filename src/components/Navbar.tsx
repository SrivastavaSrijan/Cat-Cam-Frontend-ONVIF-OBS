import type React from "react";
import {
  AppBar,
  Box,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Videocam, VideoSettings, Analytics } from "@mui/icons-material";

interface NavbarProps {
  value: number;
  handleChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const Navbar = ({ value, handleChange }: NavbarProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <AppBar
      position="static"
      sx={{
        boxShadow: "none",
        borderBottom: "1px solid",
        borderColor: "divider",
        backgroundColor: "#2a2f38", // Clean solid color
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ flexGrow: 1 }}
        >
          <Typography
            variant={isSmallScreen ? "subtitle1" : "h6"}
            component="div"
            sx={{
              fontSize: { xs: "1rem", sm: "1.25rem" },
              fontWeight: 600,
            }}
          >
            SSV Cam
          </Typography>
          {!isSmallScreen && (
            <Typography
              variant="caption"
              sx={{
                opacity: 0.8,
                display: { xs: "none", sm: "block" },
                color: "text.secondary",
                fontWeight: 400,
              }}
            >
              Enhanced ONVIF Control System
            </Typography>
          )}
        </Stack>
      </Toolbar>

      <Box px={{ xs: 0.5, sm: 1 }}>
        <Tabs
          indicatorColor="primary"
          textColor="primary"
          value={value}
          onChange={handleChange}
          sx={{
            "& .MuiTab-root": {
              color: "rgba(255, 255, 255, 0.7)",
              minHeight: { xs: 44, sm: 52 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              padding: { xs: "8px 12px", sm: "12px 20px" },
              minWidth: { xs: 80, sm: 120 },
              transition: "all 0.2s ease",
              fontWeight: 500,
              "&:hover": {
                backgroundColor: "rgba(143, 188, 143, 0.08)",
              },
            },
            "& .Mui-selected": {
              fontWeight: 600,
            },
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
            "& .MuiTabs-scrollButtons": {
              color: "rgba(255, 255, 255, 0.6)",
            },
          }}
        >
          <Tab
            icon={<Videocam />}
            label={isSmallScreen ? "Control" : "Camera & OBS Control"}
            value={1}
            iconPosition="start"
          />
          <Tab
            icon={<Analytics />}
            label={isSmallScreen ? "Scripts" : "Detection Scripts"}
            value={2}
            iconPosition="start"
          />
          <Tab
            icon={<VideoSettings />}
            label="System Status"
            value={3}
            iconPosition="start"
          />
        </Tabs>
      </Box>
    </AppBar>
  );
};

export default Navbar;
