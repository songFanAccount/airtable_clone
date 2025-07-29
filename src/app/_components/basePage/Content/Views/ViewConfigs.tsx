import { BiHide as HideIcon } from "react-icons/bi";
import { MdFilterList as FilterIcon } from "react-icons/md";
import { FaRegRectangleList as GroupIcon } from "react-icons/fa6";
import { PiArrowsDownUpBold as SortIcon } from "react-icons/pi";
import { IoColorFillOutline as ColorIcon } from "react-icons/io5";
import { CgFormatLineHeight as HeightIcon } from "react-icons/cg";
import { GrShare as ShareIcon } from "react-icons/gr";

interface ConfigButton {
  Icon: React.ElementType,
  text?: string,
  size?: string
}
const ViewConfigs = () => {
  const buttons: ConfigButton[] = [
    {Icon: HideIcon, text: "Hide fields"},
    {Icon: FilterIcon, text: "Filter"},
    {Icon: GroupIcon, text: "Group"},
    {Icon: SortIcon, text: "Sort"},
    {Icon: ColorIcon, text: "Color"},
    {Icon: HeightIcon},
    {Icon: ShareIcon, text: "Share and sync", size: "12px"},
  ]
  return (
    <div className="flex flex-row items-center gap-2">
      {
        buttons.map((buttonInfo, index) => {
          const {Icon, text, size} = buttonInfo
          return (
            <button key={index} className="flex flex-row h-[26px] gap-1 items-center hover:bg-[#f2f2f2] rounded-[3px] cursor-pointer text-gray-700 px-2">
              <Icon
                style={{
                  width: size ?? "16px",
                  height: size ?? "16px",
                }}
              />
              <span className="text-[13px]">{text}</span>
            </button>
          )
        })
      }
    </div>
  )
}
export default ViewConfigs