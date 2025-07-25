import Bases from "./Bases";
import Suggestions from "./Suggestions";

const Content = () => {
  return (
    <div className="min-h-full w-full bg-[#f9fafb] overflow-x-hidden overflow-y-auto">
      <div className="flex flex-col pt-8 px-12 h-full w-full overflow-x-auto min-w-[480px] max-w-[1920px]">
        <p className="text-[27px] font-bold w-full pb-6">Home</p>
        <Suggestions/>
        <Bases/>
      </div>
    </div>
  );
};

export default Content;