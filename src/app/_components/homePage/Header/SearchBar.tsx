import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { toastNoUI } from "~/hooks/helpers";

const SearchBar = () => {
  const [isHovered, setIsHovered] = useState<boolean>(false)
  return (
    <button className="flex items-center justify-center cursor-pointer px-4 rounded-[20px] border h-[32px] w-full min-w-[133px] max-w-[340px]"
      style={{
        borderColor: isHovered ? "#c0c1c2" : "hsl(202, 10%, 88%)",
        boxShadow: isHovered 
          ? 
            "-1px -1px 0px rgba(0, 0, 0, 0.02), 1px 1px 1px rgba(0, 0, 0, 0.06), 2px 2px 2px rgba(0, 0, 0, 0.08), 3px 3px 4px rgba(0, 0, 0, 0.06)"
          : 
            undefined
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={toastNoUI}
    >
      <MagnifyingGlassIcon className="w-4 h-4 flex-shrink-0"/>
      <span
        className="w-full flex flex-row justify-start flex-1 min-w-0 text-[13px] text-gray-500 ml-2"
      >
        Search...
      </span>
      <p className="whitespace-nowrap overflow-hidden flex-shrink-0 w-auto text-[13px] text-[#979AA0]">ctrl K</p>
    </button>
  );
};

export default SearchBar;