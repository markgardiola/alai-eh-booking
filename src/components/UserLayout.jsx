import React from "react";
import NavBar from "./NavBar";
import { Outlet } from "react-router-dom";
import ChatWidget from "./ChatWidget";

const Layout = () => {
  return (
    <div>
      <NavBar />
      <Outlet />
      <ChatWidget />
    </div>
  );
};

export default Layout;
