import { useState } from "react";
import { VscHistory as HistoryIcon } from "react-icons/vsc";
import { toastNoFunction, toastNoUI } from "~/hooks/helpers";
const RightCorner = () => {
  const [historyHovered, setHistoryHovered] = useState<boolean>(false)
  return (
    <div className="flex flex-row items-center pr-2">
      <button className="flex justify-center items-center w-7 h-7 rounded-full cursor-pointer"
        onMouseEnter={() => setHistoryHovered(true)}
        onMouseLeave={() => setHistoryHovered(false)}
        style={{
          backgroundColor: historyHovered ? "#e5e9f0" : undefined,
        }}
        onClick={toastNoUI}
      >
        <div className="w-7 h-7 flex justify-center items-center">
          <HistoryIcon className="w-4 h-4"/>
        </div>
      </button>
      <button className="flex justify-center items-center h-7 bg-[#99455a] rounded-[6px] text-white mx-2 px-3 cursor-pointer" onClick={toastNoFunction}>
        <span className="text-[13px]">Share</span>
      </button>
    </div>
  )
}
export default RightCorner