"use client"

import Header from "./Header/Header";
import SideBar from "./SideBar";
import Content from "./Content";

const HomePage = () => {
  return (
  <div className="flex flex-col h-screen w-screen">
    <Header />
    <div className="flex flex-row h-full w-full">
      <SideBar />
      <Content />
    </div>
  </div>
  );
};

export default HomePage;