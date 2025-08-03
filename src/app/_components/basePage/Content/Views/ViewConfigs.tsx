import { BiHide as HideIcon } from "react-icons/bi";
import { MdFilterList as FilterIcon } from "react-icons/md";
import { FaRegRectangleList as GroupIcon } from "react-icons/fa6";
import { PiArrowsDownUpBold as SortIcon } from "react-icons/pi";
import { IoColorFillOutline as ColorIcon } from "react-icons/io5";
import { CgFormatLineHeight as HeightIcon } from "react-icons/cg";
import { GrShare as ShareIcon } from "react-icons/gr";
import { ImTextColor as TextTypeIcon } from "react-icons/im";
import { FaHashtag as NumberTypeIcon } from "react-icons/fa";
import * as Popover from "@radix-ui/react-popover";
import * as Switch from '@radix-ui/react-switch';
import { useEffect, useState } from "react";
import { toastNoUI } from "~/hooks/helpers";
import type { FieldsData, ViewDetailedData } from "../../BasePage";
import { FieldType } from "@prisma/client";
import { api } from "~/trpc/react";

interface ConfigButton {
  Icon: React.ElementType,
  bgColor?: string, outlineColor?: string,
  text?: string,
  size?: string,
  popoverWidth: number
}
const ViewConfigs = ({ view, fields } : { view: ViewDetailedData, fields: FieldsData }) => {
  const [hiddenFieldIds, setHiddenFieldIds] = useState<Set<string>>(new Set(view?.hiddenFieldIds))
  useEffect(() => {
    if (view) {
      setHiddenFieldIds(new Set(view.hiddenFieldIds))
    }
  }, [view])
  const numHidden = hiddenFieldIds.size
  const utils = api.useUtils()
  const { mutate: updateHiddenFields, status: updateHFStatus } = api.base.updateViewHiddenFields.useMutation({
    onSuccess: async (_) => {
      await utils.base.getView.invalidate()
    }
  })
  useEffect(() => {
    if (hiddenFieldIds && view) {
      updateHiddenFields({ viewId: view.id, fieldIds: [...hiddenFieldIds] })
    }
  }, [hiddenFieldIds, view])
  const buttons: ConfigButton[] = [
    {Icon: HideIcon, bgColor: numHidden > 0 ? "#c4ecff" : undefined, outlineColor: numHidden > 0 ? "#b0d4e5" : undefined, text: numHidden > 0 ? `${numHidden} hidden field${numHidden > 1 ? "s" : ""}` : "Hide fields", popoverWidth: 320},
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
          const {Icon, bgColor, outlineColor, text, size, popoverWidth} = buttonInfo
          const bg = index === 0 && numHidden > 0 ? bgColor : undefined
          const hoverBg = bgColor ?? "#f2f2f2"
          return (
            <Popover.Root
              key={index}
              open={popoverIndex !== undefined && popoverIndex === index}
              onOpenChange={(open) => setPopoverIndex(open ? index : undefined)}
            >
              <Popover.Anchor asChild>
                <button className={`flex flex-row h-[26px] gap-1 items-center hover:[outline:var(--hover-outline)] hover:[background-color:var(--hover-color)] rounded-[3px] cursor-pointer text-gray-700 px-2`}
                  style={{ '--hover-color': hoverBg, '--hover-outline': `2px solid ${outlineColor}`, backgroundColor: bg } as React.CSSProperties}
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
                      <div className="flex flex-col gap-2 w-full text-gray-600 text-[13px]">
                        {
                          fields?.map((field, index) => {
                            const Icon = field.type === FieldType.Text ? TextTypeIcon : NumberTypeIcon
                            const dim = field.type === FieldType.Text ? "16px" : "12px"
                            return (
                              <div key={index} className="flex flex-row px-1 items-center h-[20px] cursor-pointer hover:bg-[#f2f2f2] rounded-[3px]"
                                onClick={() => {
                                  const checked = !hiddenFieldIds.has(field.id)
                                  const newHiddenFieldIds = new Set(hiddenFieldIds)
                                  if (checked) newHiddenFieldIds.add(field.id)
                                  else newHiddenFieldIds.delete(field.id)
                                  setHiddenFieldIds(newHiddenFieldIds)
                                }}
                              >
                                <Switch.Root
                                  id={`switch-${field.name}`}
                                  checked={!hiddenFieldIds.has(field.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  onCheckedChange={(value) => {
                                    const newHiddenFieldIds = new Set(hiddenFieldIds)
                                    if (!value) newHiddenFieldIds.add(field.id)
                                    else newHiddenFieldIds.delete(field.id)
                                    setHiddenFieldIds(newHiddenFieldIds)
                                  }}
                                  className="
                                    w-[12.8px] h-[8px] bg-gray-300 rounded-full relative 
                                    data-[state=checked]:bg-green-700 
                                    focus:outline-none
                                    transition-colors
                                    cursor-pointer
                                  "
                                >
                                  <Switch.Thumb
                                    className="
                                      block w-1 h-1 bg-white rounded-full shadow-md 
                                      transition-transform 
                                      translate-x-[2px]
                                      cursor-pointer
                                      data-[state=checked]:translate-x-2
                                    "
                                  />
                                </Switch.Root>
                                <div className="w-4 h-4 mr-2 ml-4 flex justify-center items-center">
                                  <Icon className=""
                                    style={{
                                      width: dim,
                                      height: dim,
                                    }}
                                  />
                                </div>
                                <span>
                                  {field.name}
                                </span>
                              </div>
                            )
                          })
                        }
                        <div className="flex flex-row items-center justify-between h-[26px] w-full mt-2 text-[12px] font-[500] text-gray-700 hover:text-black">
                          {
                            [
                              {text: "Hide all", func: () => setHiddenFieldIds(new Set(fields?.map(field => field.id)))},
                              {text: "Show all", func: () => setHiddenFieldIds(new Set())}
                            ].map(({text, func}, index) => (
                              <button key={index} className="w-[136px] h-full rounded-[3px] flex justify-center items-center bg-[#f5f5f5] hover:bg-[#f2f2f2] cursor-pointer"
                                onClick={func}
                              >
                                <span>{text}</span>
                              </button>
                            ))
                          }
                        </div>
                      </div>
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