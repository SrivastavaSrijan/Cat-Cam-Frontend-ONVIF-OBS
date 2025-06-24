import React from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Stack,
} from "@mui/material";
import {
  Videocam,
  VideoSettings,
  Analytics,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { usePWABackgroundSync } from "../hooks";

interface NavbarProps {
  value: number;
  handleChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const menuItems = [
  { value: 1, icon: <Videocam />, label: "Camera" },
  { value: 2, icon: <Analytics />, label: "Analytics" },
  { value: 3, icon: <VideoSettings />, label: "Settings" },
];

const Navbar = ({ value, handleChange }: NavbarProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Set up PWA background sync
  usePWABackgroundSync();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (newValue: number) => {
    handleChange({} as React.SyntheticEvent, newValue);
    handleMenuClose();
  };

  const currentItem = menuItems.find((item) => item.value === value);

  return (
    <Toolbar
      variant="dense"
      sx={{ display: "flex", justifyContent: "flex-end", px: 0 }}
    >
      <IconButton
        edge="end"
        color="inherit"
        aria-label="menu"
        size="small"
        onClick={handleMenuOpen}
        sx={{ mr: 2 }}
      >
        <MenuIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        {menuItems.map((item) => (
          <MenuItem
            key={item.value}
            onClick={() => handleMenuItemClick(item.value)}
            selected={item.value === value}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </MenuItem>
        ))}
      </Menu>
    </Toolbar>
  );
};

export default Navbar;
