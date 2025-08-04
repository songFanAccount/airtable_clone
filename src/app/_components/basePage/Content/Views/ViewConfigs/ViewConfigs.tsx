import { BiHide as HideIcon } from "react-icons/bi";
import { MdFilterList as FilterIcon } from "react-icons/md";
import { FaRegRectangleList as GroupIcon } from "react-icons/fa6";
import { PiArrowsDownUpBold as SortIcon } from "react-icons/pi";
import { IoColorFillOutline as ColorIcon } from "react-icons/io5";
import { CgFormatLineHeight as HeightIcon } from "react-icons/cg";
import { GrShare as ShareIcon } from "react-icons/gr";
import * as Popover from "@radix-ui/react-popover";
import { useEffect, useRef, useState } from "react";
import { toastNoUI } from "~/hooks/helpers";
import { type FieldsData, type ViewDetailedData } from "../../../BasePage";
import { api } from "~/trpc/react";
import HideFieldsConfig from "./HideFieldsConfig";
import FiltersConfig, { operatorToText } from "./FiltersConfig";
import { toast } from "react-toastify";
import { FilterOperator } from "@prisma/client";
import SortsConfig from "./SortsConfig";

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
  const hiddenFieldIds = new Set(view?.hiddenFieldIds)
  const numHidden = hiddenFieldIds.size
  /* Filter config */
  const filters = view?.filters
  const filtersActive = filters?.filter(filter => {
    if (filter.operator === FilterOperator.EMPTY || filter.operator === FilterOperator.NOTEMPTY) return true
    else return filter.compareVal !== ""
  }).map(filter => fields?.find(field => filter.fieldId === field.id)?.name ?? "") ?? []
  const activeFilterNames = [...(new Set(filtersActive))]
  const [filterVals, setFilterVals] = useState<string[] | undefined>(undefined)
  const filtersToUpdateRef = useRef<Set<number>>(new Set())
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)
  const { mutate: changeFilterCompareVal } = api.base.changeFilterCompareVal.useMutation({
    onSuccess: async (updatedFilter) => {
      const field = fields?.find(field => field.id === updatedFilter.fieldId)
      if (field) {
        toast.success(`Applying ${updatedFilter.joinType.toUpperCase()} filter: ${field.name} ${operatorToText(updatedFilter.operator, false)} "${updatedFilter.compareVal}"`)
      }
      await utils.base.getView.invalidate()
    }
  })
  function changeFilterVal(i: number, newVal: string) {
    if (!filters || !filterVals) return
    const newFilterVals = [...filterVals]
    newFilterVals[i] = newVal
    setFilterVals(newFilterVals)
    filtersToUpdateRef.current.add(i)
    if (timer) clearTimeout(timer)
    const newTimer = setTimeout(() => {
      for (const updateI of filtersToUpdateRef.current) {
        if (!filters[updateI]) continue
        if (filterVals[updateI] === undefined) continue
        changeFilterCompareVal({filterId: filters[updateI].id, newCompareVal: updateI === i ? newVal : filterVals[updateI]})
        filtersToUpdateRef.current.delete(updateI)
      }
    }, 1000)
    setTimer(newTimer)
  }
  /* Sort fields config */
  const sorts = view?.sorts
  useEffect(() => {
    if (filters) {
      const newFilterVals = filters.map((filter) => filter.compareVal)
      setFilterVals(newFilterVals)
    }
  }, [filters])
  const filterText = activeFilterNames.length > 0 ? `Filtered by ${activeFilterNames[0]}${activeFilterNames.length > 3 ? ` and ${activeFilterNames.length - 1} other fields` : activeFilterNames.length > 1 ? `, ${activeFilterNames.slice(1).join(', ')}` : ''}` : "Filter"
  const sortText = sorts && sorts.length > 0 ? `Sorted by ${sorts.length} fields` : "Sorted" 
  const buttons: ConfigButton[] = [
    {Icon: HideIcon, bgColor: numHidden > 0 ? "#c4ecff" : undefined, outlineColor: numHidden > 0 ? "#b0d4e5" : undefined, text: numHidden > 0 ? `${numHidden} hidden field${numHidden > 1 ? "s" : ""}` : "Hide fields", popoverWidth: 320},
    {Icon: FilterIcon, bgColor: activeFilterNames.length > 0 ? "#cff5d1" : undefined, outlineColor: activeFilterNames.length > 0 ? "#badcbc" : undefined, text: filterText, popoverWidth: filters && filters.length > 0 ? 540 : 220},
    {Icon: GroupIcon, text: "Group", popoverWidth: 280},
    {Icon: SortIcon, bgColor: sorts && sorts.length > 0 ? "#fedfcb" : undefined, outlineColor: sorts && sorts.length > 0 ? "#e4c8b6" : undefined, text: sortText, popoverWidth: sorts && sorts.length > 0 ? 480 : 320},
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
          const active = 
            (index === 0 && numHidden > 0) ||
            (index === 1 && activeFilterNames.length > 0) ||
            (index === 3 && sorts && sorts.length > 0)
          const bg = active ? bgColor : undefined
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
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  side="bottom"
                  align="end"
                  className="bg-white rounded-[6px] w-fit p-4 z-50 relative top-2 left-0 text-[13px]"
                  style={{
                    boxShadow: "0 4px 16px 0 rgba(0, 0, 0, .25)",
                    width: `${popoverWidth}px`
                  }}
                >
                  {
                    !view
                    ?
                      <></>
                    :
                      index === 0
                    ?
                      <HideFieldsConfig viewId={view?.id} fields={fields} hiddenFieldIds={hiddenFieldIds}/>
                    : index === 1 ?
                      <FiltersConfig viewId={view?.id} fields={fields} filters={filters} filterVals={filterVals} changeFilterVal={changeFilterVal} />
                    : index === 3 ?
                      <SortsConfig viewId={view?.id} fields={fields} sorts={sorts}/>
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