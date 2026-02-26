import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "../components/Navbar";
import ShowAlbum from "../components/ShowAlbum";
import AddAlbum from "../components/AddAlbum";
import EditAlbum from "../components/EditAlbum";
import Footer from "../components/Footer";
import Home from "../components/Home";
import 'bootstrap/dist/css/bootstrap.min.css'

const App = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddAlbum />} />
        <Route path="/edit/:id" element={<EditAlbum />} />
        <Route path="/album/:id" element={<ShowAlbum />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
};

export default App;
