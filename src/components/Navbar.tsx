import type React from "react";
import { usePWABackgroundSync } from "../hooks";

interface NavbarProps {
  value: number;
  handleChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const Navbar = ({ value, handleChange }: NavbarProps) => {
  // Return null to completely remove the navbar
  return null;
};

export default Navbar;
