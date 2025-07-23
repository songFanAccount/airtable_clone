import CreatedBasesSection from "./CreatedBasesSection";
import CreateNewBasesSection from "./CreateNewBaseSection";

const SideBar = () => {
  return (
    <div className="flex flex-col justify-between items-center h-full pt-5 border-r w-[46px] min-w-[46px] bg-white" style={{ borderColor: "hsl(202, 10%, 88%)" }}>
      <CreatedBasesSection/>
      <CreateNewBasesSection/>
    </div>
  );
};

export default SideBar;