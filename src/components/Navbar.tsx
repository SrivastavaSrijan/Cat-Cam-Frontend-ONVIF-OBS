import type React from "react";
import { AppBar, Box, Tab, Tabs } from "@mui/material";
import { Videocam, VideoSettings, Analytics } from "@mui/icons-material";

interface NavbarProps {
  value: number;
  handleChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const Navbar = ({ value, handleChange }: NavbarProps) => {
  return (
    <AppBar position="static" elevation={2}>
      <Tabs value={value} onChange={handleChange} variant="fullWidth" centered>
        <Tab
          icon={<Videocam fontSize="medium" />}
          value={1}
          iconPosition="start"
        />
        {/* <Tab
          icon={<LiveTv fontSize="medium" />}
          value={4}
          iconPosition="start"
        /> */}
        <Tab
          icon={<Analytics fontSize="medium" />}
          value={2}
          iconPosition="start"
        />
        <Tab
          icon={<VideoSettings fontSize="medium" />}
          value={3}
          iconPosition="start"
        />
      </Tabs>
    </AppBar>
  );
};

export default Navbar;
