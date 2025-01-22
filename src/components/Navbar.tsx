import React from "react";
import { AppBar, Box, Tab, Tabs, Toolbar, Typography } from "@mui/material";

interface NavbarProps {
  value: number;
  handleChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const Navbar = ({ value, handleChange }: NavbarProps) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          🐈‍⬛ SSV Cat Cam Control 🐈
        </Typography>
      </Toolbar>
      <Box px={2}>
        <Tabs
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          value={value}
          onChange={handleChange}
        >
          <Tab label="Camera Control" value={0} />
          <Tab label="OBS Control" value={1} />
        </Tabs>
      </Box>
    </AppBar>
  );
};

export default Navbar;
