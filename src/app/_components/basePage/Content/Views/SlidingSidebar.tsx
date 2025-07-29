import { GoPlus as AddIcon } from "react-icons/go";
import { MagnifyingGlassIcon as SearchIcon } from "@heroicons/react/24/outline";
import { RiSettings4Line as SettingsIcon } from "react-icons/ri";
import { MdOutlineTableChart as TableIcon } from "react-icons/md";
import { StarIcon } from "@heroicons/react/24/outline"
import { HiOutlineDotsHorizontal as OptionsIcon } from "react-icons/hi";
import { toastNoFunction, toastNoUI } from "~/hooks/helpers";
import type { ViewData, ViewsData } from "../../BasePage";
import { useState } from "react";
import { api } from "~/trpc/react";

const ViewButton = ({ viewData, isCurrent, navToView } : { viewData: ViewData, isCurrent: boolean, navToView: (viewId: string) => void }) => {
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const StartIcon = isHovered ? StarIcon : TableIcon
  return (
    <div className="flex flex-row items-center justify-between h-[32.25px] hover:bg-[#f2f2f2] rounded-[6px] cursor-pointer px-3 py-2"
      style={{
        backgroundColor: isCurrent || isHovered ? "#f2f2f2" : undefined
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {if(viewData) navToView(viewData.id)}}
    >
      <div className="flex flex-row items-center gap-2">
        <StartIcon className="w-4 h-4"
          color={isHovered ? undefined : "#3380e5"}
          onClick={(e) => {
            e.stopPropagation()
            toastNoFunction()
          }}
        />
        <span className="font-[500]">{viewData?.name}</span>
      </div>
      {
        isHovered &&
        <button className="mr-[6px] cursor-pointer">
          <OptionsIcon className="w-4 h-4"/>
        </button>
      }
    </div>
  )
}
const SlidingSidebar = ({ views, currentView, navToView } : { views: ViewsData, currentView: ViewData, navToView: (viewId: string) => void }) => {
  const utils = api.useUtils()
  const { mutate: createView, status } = api.base.addNewView.useMutation({
    onSuccess: async (createdView) => {
      if (createdView) {
        await utils.base.getAllFromBase.invalidate()
        const newViewId = createdView.id
        if (newViewId) navToView(newViewId)
      }
    }
  })
  function onCreateView() {
    if (views && currentView) {
      let newViewNumber = 1
      while (views.some(view => view.name === `Grid ${newViewNumber}`)) newViewNumber++
      createView({
        newName: `Grid ${newViewNumber}`,
        tableId: currentView.tableId
      })
    }
  }
  return (
    <div className="flex flex-col w-full text-[13px]">
      <div className="flex flex-col w-full pb-2">
        <button className="pl-4 pr-3 flex flex-row items-center h-8 gap-2 hover:bg-[#f2f2f2] rounded-[6px] cursor-pointer text-gray-800"
          onClick={onCreateView}
        >
          <AddIcon className="w-4 h-4"/>
          <span>Create new grid view</span>
        </button>
        <div className="w-full pl-4 pr-3 flex flex-row items-center h-8 justify-between text-gray-500">
          <div className="flex flex-row items-center gap-2">
            <SearchIcon className="w-[14px] h-[14px]"/>
            <span onClick={toastNoFunction}>Find a view</span>
          </div>
          <button className="flex justify-center items-center h-7 w-7 hover:bg-[#f2f2f2] rounded-[6px] cursor-pointer" onClick={toastNoUI}>
            <SettingsIcon className="w-[18px] h-[18px]"/>
          </button>
        </div>
      </div>
      {
        views?.map((viewData, index) => <ViewButton key={index} viewData={viewData} isCurrent={viewData.id === currentView?.id} navToView={navToView}/>)
      }
    </div>
  );
}

export default SlidingSidebar