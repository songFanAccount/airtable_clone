import { BiHide as HideIcon } from "react-icons/bi";
import { MdFilterList as FilterIcon } from "react-icons/md";
import { FaRegRectangleList as GroupIcon } from "react-icons/fa6";
import { PiArrowsDownUpBold as SortIcon } from "react-icons/pi";
import { IoColorFillOutline as ColorIcon } from "react-icons/io5";
import { CgFormatLineHeight as HeightIcon } from "react-icons/cg";
import { GrShare as ShareIcon } from "react-icons/gr";
import * as Popover from "@radix-ui/react-popover";
import { useEffect, useState } from "react";
import { toastNoUI } from "~/hooks/helpers";
import { type FilterData, type FieldsData, type ViewDetailedData } from "../../../BasePage";
import { api } from "~/trpc/react";
import HideFieldsConfig from "./HideFieldsConfig";
import FiltersConfig from "./FiltersConfig";

interface ConfigButton {
  Icon: React.ElementType,
  bgColor?: string, outlineColor?: string,
  text?: string,
  size?: string,
  popoverWidth: number
}
const ViewConfigs = ({ view, fields } : { view: ViewDetailedData, fields: FieldsData }) => {
  const utils = api.useUtils()
  /* Hide fields config */
  const [hiddenFieldIds, setHiddenFieldIds] = useState<Set<string>>(new Set(view?.hiddenFieldIds))
  const numHidden = hiddenFieldIds.size
  const { mutate: updateHiddenFields, status: updateHFStatus } = api.base.updateViewHiddenFields.useMutation({
    onSuccess: async (_) => {
      await utils.base.getView.invalidate()
      await utils.base.getRecords.invalidate()
    }
  })
  useEffect(() => {
    if (!view) return;
    const timeout = setTimeout(() => {
      if (updateHFStatus !== "pending") {
        updateHiddenFields({ viewId: view.id, fieldIds: [...hiddenFieldIds] });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [hiddenFieldIds, view?.id]);
  /* Filter config */
  const [filters, setFilters] = useState<FilterData[] | undefined>(view?.filters)
  const [filterVals, setFilterVals] = useState<string[] | undefined>(undefined)
  useEffect(() => {
    if (filters) {
      const newFilterVals = filters.map((filter) => filter.compareVal)
      setFilterVals(newFilterVals)
    }
  }, [filters])
  useEffect(() => {
    if (view) {
      setHiddenFieldIds(new Set(view.hiddenFieldIds))
      setFilters(view.filters)
    }
  }, [view])
  const buttons: ConfigButton[] = [
    {Icon: HideIcon, bgColor: numHidden > 0 ? "#c4ecff" : undefined, outlineColor: numHidden > 0 ? "#b0d4e5" : undefined, text: numHidden > 0 ? `${numHidden} hidden field${numHidden > 1 ? "s" : ""}` : "Hide fields", popoverWidth: 320},
    {Icon: FilterIcon, text: "Filter", popoverWidth: filters && filters.length > 0 ? 540 : 220},
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
                      <HideFieldsConfig fields={fields} hiddenFieldIds={hiddenFieldIds} setHiddenFieldIds={setHiddenFieldIds}/>
                    : index === 1 ?
                      <FiltersConfig viewId={view?.id} fields={fields} filters={filters} setFilters={setFilters} filterVals={filterVals} setFilterVals={setFilterVals} />
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