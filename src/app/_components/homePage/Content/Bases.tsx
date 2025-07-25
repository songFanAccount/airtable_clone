import { useState } from "react";
import { MdKeyboardArrowDown as DropdownIcon } from "react-icons/md";
import { PiListLight as ListIcon, PiGridFour as GridIcon } from "react-icons/pi";
import BasesList from "./BasesList";
import BasesGrid from "./BasesGrid";


const OpenedInDropdown = () => {
  return (
    <button className="flex flex-row items-center gap-1 group text-gray-600 cursor-pointer">
      <p className="text-[15px] group-hover:text-[rgb(29,31,37)]">Opened anytime</p>
      <DropdownIcon className="text-[16px] group-hover:text-[rgb(29,31,37)]"/>
    </button>
  )
}

interface ViewModeInfo {
  Icon: React.ElementType,
  helperText: string
}
const enum viewModes {
  LIST = 0,
  GRID = 1
}
const ViewModes = ({ mode, setMode } : { mode: viewModes, setMode: (mode: viewModes) => void }) => {
  const modes: ViewModeInfo[] = [
    {
      Icon: ListIcon,
      helperText: "View items in a list"
    },
    {
      Icon: GridIcon,
      helperText: "View items in a grid"
    }
  ]
  return (
    <div className="flex flex-row items-center">
      {
        modes.map((modeInfo, index) => {
          const {Icon} = modeInfo
          const mappedMode = index === 0 ? viewModes.LIST : viewModes.GRID
          const selected = mode === mappedMode
          return (
            <button key={index} className="p-1 rounded-full cursor-pointer"
              style={{
                backgroundColor: selected ? 'rgba(0, 0, 0, 0.05)' : undefined
              }}
              onClick={() => setMode(index)}
            >
              <Icon className="w-5 h-5"
                style={{
                  color: selected ? "black" : "#55565b"
                }}
              />
            </button>
          )
        })
      }
    </div>
  )
}

const DisplayModes = ({ viewMode, setViewMode } : { viewMode: viewModes, setViewMode: (mode: viewModes) => void }) => {
  return (
    <div className="flex flex-row justify-between items-center pb-[20px]">
      <OpenedInDropdown/>
      <ViewModes mode={viewMode} setMode={setViewMode}/>
    </div>
  )
}

export interface BaseInfo {
  name: string,
  lastOpened: string,
  workspace: string
}

const Bases = () => {
  const [viewMode, setViewMode] = useState<viewModes>(viewModes.LIST)
  const tempBases: BaseInfo[] = [
    {
      name: "Untitled Base",
      lastOpened: "just now",
      workspace: "My First Workspace"
    },
    {
      name: "layout",
      lastOpened: "2 hours ago",
      workspace: "My First Workspace"
    },
  ]
  return (
    <div className="flex flex-col w-full">
      <DisplayModes viewMode={viewMode} setViewMode={setViewMode}/>
      {
        viewMode === viewModes.LIST
        ?
          <BasesList bases={tempBases}/>
        :
          <BasesGrid bases={tempBases}/>
      }
    </div>
  )
}
export default Bases