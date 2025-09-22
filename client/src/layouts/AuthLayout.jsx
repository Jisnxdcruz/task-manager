// src/layouts/AuthLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function AuthLayout() {
  return (
    <>
      <Navbar />
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </>
  );
}