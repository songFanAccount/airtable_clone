import { useState } from "react"
import type { BaseInfo } from "./Bases"
import { HomeBoxWrapper } from "./Suggestions"
import { GoDatabase as BaseIcon } from "react-icons/go"
import { StarIcon } from "@heroicons/react/24/outline"
import { LuEllipsis as ActionsIcon } from "react-icons/lu"
import { toastNoFunction, toastNoUI, toastTODO } from "~/hooks/helpers"

const BaseBox = ({ info } : { info: BaseInfo }) => {
  const { name, lastOpened } = info
  const shortenedName = `${name[0]?.toUpperCase()}${name.length > 1 ? name[1] : ''}`
  const [isHovered, setIsHovered] = useState<boolean>(false)
  return (
    <HomeBoxWrapper>
      <div className="flex flex-row h-[92px] items-center relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => toastTODO("Open base")}
      >
        <div className="w-[92px] h-[92px] flex justify-center items-center">
          <div className="flex justify-center items-center w-[56px] h-[56px] rounded-[12px] bg-[#99455a] text-white border-box">
            <span className="text-[22px]">{shortenedName}</span>
          </div>
        </div>
        <div className="flex flex-col mr-4">
          <span className="text-[13px] font-[500] h-[19.5px]">{name}</span>
          <div className="flex flex-col justify-center h-[16.5px] mt-1">
            {
              isHovered
              ?
                <div className="flex flex-row items center text-gray-600">
                  <div className="w-4 h-4 flex justify-center items-center mr-2">
                    <BaseIcon className="w-[14px] h-[14px]"/>
                  </div>
                  <span className="text-[11px]">Open data</span>
                </div>
              :
                <span className="text-[11px] text-gray-600">Opened {lastOpened}</span>
            }
          </div>
        </div>
        {
          isHovered &&
          <div className="absolute top-0 right-0 mt-4 mr-4 ml-1">
            <div className="flex flex-row items-center gap-x-[6px]">
              <button className="w-[28px] h-[28px] flex justify-center items-center border rounded-[6px] text-gray-800 cursor-pointer"
                style={{
                  borderColor: "#d5d5d5"
                }}
                onClick={(event) => {
                  event.stopPropagation()
                  toastNoFunction()
                }}
              >              
                <StarIcon className="w-[16px] h-[16px]"/>
              </button>
              <button className="w-[28px] h-[28px] flex justify-center items-center border rounded-[6px] cursor-pointer"
                style={{
                  borderColor: "#d5d5d5"
                }}
                onClick={(event) => {
                  event.stopPropagation()
                  toastNoUI()
                }}
              >           
                <ActionsIcon className="w-[14px] h-[14px]"/>
              </button>
            </div>
          </div>
        }
      </div>
    </HomeBoxWrapper>
  )
}
const BasesGrid = ({ bases } : { bases: BaseInfo[] }) => {
  return (
    <div className="w-full px-1 min-h-[500px]">
      <div className="w-full overflow-x-hidden py-1 mb-6 flex-shrink-0">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(286px, 1fr))",
            minWidth: "384px"
          }}
        >
          {bases.map((baseInfo, index) => (
            <BaseBox key={index} info={baseInfo} />
          ))}
        </div>
      </div>
    </div>
  )
}
export default BasesGrid