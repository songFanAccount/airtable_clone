"use client"

import Header from "./Header/Header";
import SideBar from "./SideBar/SideBar";
import Content from "./Content/Content";

const HomePage = () => {
  return (
  <div className="flex flex-col h-screen w-screen overflow-x-clip">
    <Header />
    <div className="flex flex-row h-full w-full overflow-x-hidden">
      <SideBar />
      <Content />
    </div>
  </div>
  );
};

export default HomePage;