import { BiHide as HideIcon } from "react-icons/bi";
import { MdFilterList as FilterIcon } from "react-icons/md";
import { FaRegRectangleList as GroupIcon } from "react-icons/fa6";
import { PiArrowsDownUpBold as SortIcon } from "react-icons/pi";
import { IoColorFillOutline as ColorIcon } from "react-icons/io5";
import { CgFormatLineHeight as HeightIcon } from "react-icons/cg";
import { GrShare as ShareIcon } from "react-icons/gr";
import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import { toastNoUI } from "~/hooks/helpers";

interface ConfigButton {
  Icon: React.ElementType,
  text?: string,
  size?: string,
  popoverWidth: number
}
const ViewConfigs = () => {
  const buttons: ConfigButton[] = [
    {Icon: HideIcon, text: "Hide fields", popoverWidth: 320},
    {Icon: FilterIcon, text: "Filter", popoverWidth: 320},
    {Icon: GroupIcon, text: "Group", popoverWidth: 280},
    {Icon: SortIcon, text: "Sort", popoverWidth: 320},
    {Icon: ColorIcon, text: "Color", popoverWidth: 300},
    {Icon: HeightIcon, popoverWidth: 128},
    {Icon: ShareIcon, text: "Share and sync", size: "12px", popoverWidth: 424},
  ]
  const [popoverIndex, setPopoverIndex] = useState<number | undefined>(undefined)
  return (
    <div className="flex flex-row items-center gap-2">
      {
        buttons.map((buttonInfo, index) => {
          const {Icon, text, size, popoverWidth} = buttonInfo
          return (
            <Popover.Root
              key={index}
              open={popoverIndex !== undefined && popoverIndex === index}
              onOpenChange={(open) => setPopoverIndex(open ? index : undefined)}
            >
              <Popover.Anchor asChild>
                <button className="flex flex-row h-[26px] gap-1 items-center hover:bg-[#f2f2f2] rounded-[3px] cursor-pointer text-gray-700 px-2"
                  onClick={() => {
                    if ([2,4,5,6].includes(index)) {
                      toastNoUI()
                      return
                    }
                    setPopoverIndex(index)
                  }}
                >
                  <Icon
                    style={{
                      width: size ?? "16px",
                      height: size ?? "16px",
                    }}
                    />
                  <span className="text-[13px]">{text}</span>
                </button>
              </Popover.Anchor>
              <Popover.Portal>
                <Popover.Content
                  side="bottom"
                  align="end"
                  className="bg-white rounded-[6px] p-4 z-50 relative top-2 left-0 text-[13px]"
                  style={{
                    boxShadow: "0 4px 16px 0 rgba(0, 0, 0, .25)",
                    width: popoverWidth
                  }}
                >
                  {
                    index === 0
                    ?
                      <div>Fields: Show/Hide fields</div>
                    : index === 1 ?
                      <div>Filters on columns: for both numbers (greater than, smaller than) and text (is not empty, is empty, contains, not contains, equal to)</div>
                    : index === 3 ?
                      <div>Simple sorting on columns: for text A→Z, Z→A, for numbers, do decreasing or increasing</div>
                    :
                      <></>
                  }
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          )
        })
      }
    </div>
  )
}
export default ViewConfigs