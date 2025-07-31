import { GoPlus as AddIcon } from "react-icons/go";
import { MagnifyingGlassIcon as SearchIcon } from "@heroicons/react/24/outline";
import { RiSettings4Line as SettingsIcon } from "react-icons/ri";
import { MdOutlineTableChart as TableIcon } from "react-icons/md";
import { StarIcon } from "@heroicons/react/24/outline"
import { HiOutlineDotsHorizontal as OptionsIcon } from "react-icons/hi";
import { MdOutlineModeEdit as RenameIcon } from "react-icons/md";
import { HiOutlineTrash as DeleteIcon } from "react-icons/hi";
import { toastNoFunction, toastNoUI } from "~/hooks/helpers";
import * as Popover from "@radix-ui/react-popover";
import type { ViewData, ViewsData } from "../../BasePage";
import { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "react-toastify";

const ViewButton = ({ views, viewData, isCurrent, navToView, onlyView } : { views: ViewsData, viewData: ViewData, isCurrent: boolean, navToView: (viewId: string) => void, onlyView: boolean }) => {
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [actionsOpen, setActionsOpen] = useState<boolean>(false)
  const [isRenaming, setIsRenaming] = useState<boolean>(false)
  const showOptions = (isHovered || actionsOpen) && !isRenaming
  const [newName, setNewName] = useState<string>(viewData?.name ?? "")
  const StartIcon = showOptions ? StarIcon : TableIcon
  const utils = api.useUtils()
  const { mutate: deleteView, status } = api.base.deleteView.useMutation({
    onSuccess: async (newCurrentView) => {
      if (newCurrentView) {
        toast.success(`Deleted view!`)
        await utils.base.getAllFromBase.invalidate()
        navToView(newCurrentView.id)
      }
    }
  }) 
  function onDeleteView() {
    if (status === "pending") return
    if (onlyView) {
      toast.error("Cannot delete only view!")
      return
    }
    if (viewData) {
      deleteView({ viewId: viewData.id, isCurrentView: isCurrent })
      setActionsOpen(false)
    }
  }
  const { mutate: renameView, status: renameStatus } = api.base.renameView.useMutation({
    onSuccess: async (updatedView) => {
      if (updatedView) {
        toast.success(`Renamed view: "${updatedView.name}"`)
        await utils.base.getAllFromBase.invalidate()
      }
    }
  })
  function handleOnBlur() {
    setIsRenaming(false)
    if (viewData) {
      const newNameTrimmed = newName.trim()
      if (newNameTrimmed === "") {
        setNewName(viewData.name)
        return
      }
      if (newNameTrimmed === viewData.name) return
      if (views?.some(viewData => viewData?.name === newNameTrimmed)) {
        setNewName(viewData.name)
        toast.error(`A view named "${newNameTrimmed}" already exists!`)
        return
      }
      renameView({ viewId: viewData.id, newName: newNameTrimmed })
    }
  }
  return (
    <Popover.Root open={actionsOpen} onOpenChange={setActionsOpen}>
      <div className="flex flex-row items-center justify-between h-[32.25px] hover:bg-[#f2f2f2] rounded-[6px] cursor-pointer px-3 py-2"
        style={{
          backgroundColor: isCurrent ? "#f2f2f2" : undefined
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {if(viewData) navToView(viewData.id)}}
      >
        <div className="flex flex-row items-center gap-2 w-full">
          <StartIcon className="w-4 h-4"
            color={showOptions ? undefined : "#3380e5"}
            onClick={(e) => {
              e.stopPropagation()
              toastNoFunction()
            }}
          />
          <div className="w-full font-[500]">
            {
              isRenaming
              ?
                <input 
                  className="w-full bg-white outline-none border-[2px] border-[#bfbfbf] rounded-[3px] border-box pl-[2px] h-[19px] relative left-[-4px]"
                  autoFocus={true}
                  onFocus={(e) => e.target.select()}
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value)
                  }}
                  onBlur={handleOnBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleOnBlur()
                  }}
                />
              :
                <span className="">{viewData?.name}</span>
            }
          </div>
        </div>
        {
          showOptions &&
          <Popover.Trigger asChild>
            <button className="h-[32.25px] mr-[6px] cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                setActionsOpen(true)
              }}
            >
              <OptionsIcon className="w-4 h-4"/>
            </button>
          </Popover.Trigger>
        }
      </div>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          className="bg-white rounded-[6px] z-50 relative top-1 left-1"
          style={{
            boxShadow: "0 4px 16px 0 rgba(0, 0, 0, .25)",
            padding: "8px",
            width: "180px"
          }}
        >
          <div className="flex flex-col w-full text-gray-700 text-[13px]">
            <button className="flex flex-row items-center h-8 p-2 gap-2 hover:bg-[#f2f2f2] rounded-[6px] cursor-pointer disabled:cursor-not-allowed"
              disabled={renameStatus === "pending"}
              onClick={() => {
                if (renameStatus === "pending") return
                setIsRenaming(true)
              }}
            >
              <RenameIcon className="w-[14px] h-[14px]"/>
              <span>Rename view</span>
            </button>
            <button className="flex flex-row items-center h-8 p-2 gap-2 hover:bg-[#f2f2f2] rounded-[6px] cursor-pointer disabled:cursor-not-allowed"
              onClick={onDeleteView}
              disabled={status === "pending"}
            >
              <DeleteIcon className="w-[14px] h-[14px]"/>
              <span>Delete view</span>
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
const SlidingSidebar = ({ views, currentView, navToView } : { views: ViewsData, currentView: ViewData, navToView: (viewId: string) => void }) => {
  const utils = api.useUtils()
  const { mutate: createView, status } = api.base.addNewView.useMutation({
    onSuccess: async (createdView) => {
      if (createdView) {
        toast.success(`Created new view: "${createdView.name}"`)
        await utils.base.getAllFromBase.invalidate()
        const newViewId = createdView.id
        if (newViewId) navToView(newViewId)
      }
    }
  })
  function onCreateView() {
    if (status === "pending") return
    if (views && currentView) {
      let newViewNumber = 1
      while (views.some(view => view?.name === `Grid ${newViewNumber}`)) newViewNumber++
      createView({
        newName: `Grid ${newViewNumber}`,
        tableId: currentView.tableId
      })
    }
  }
  return (
    <div className="flex flex-col w-full text-[13px]">
      <div className="flex flex-col w-full pb-2">
        <button className="pl-4 pr-3 flex flex-row items-center h-8 gap-2 hover:bg-[#f2f2f2] rounded-[6px] cursor-pointer text-gray-800 disabled:cursor-not-allowed"
          disabled={status === "pending"}
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
        views?.map((viewData, index) => <ViewButton key={index} views={views} viewData={viewData} isCurrent={viewData?.id === currentView?.id} navToView={navToView} onlyView={views.length === 1}/>)
      }
    </div>
  );
}

export default SlidingSidebar