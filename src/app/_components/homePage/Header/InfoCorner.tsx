import { QuestionMarkCircleIcon, BellIcon } from "@heroicons/react/24/outline";
import ProfileButton from "./ProfileButton";
const InfoCorner = () => {
  return (
    <div className="flex items-center justify-end h-full w-full min-w-[170px]">
      <div className="flex flex-row items-center">
        <div className="flex justify-center items-center w-7 h-7">
          <QuestionMarkCircleIcon className="w-4 h-4 flex-shrink-0"/>
        </div>
        <button className="flex justify-center items-center w-7 h-7 border rounded-full mx-[0.75rem]" style={{borderColor: "hsl(202, 10%, 88%)"}}>
          <BellIcon className="w-4 h-4 flex-shrink-0"/>
        </button>
      </div>
      <div className="flex justify-center items-center ml-2 w-7 h-7 flex-shrink-0">
        <ProfileButton/>
      </div>
    </div>
  );
};

export default InfoCorner;