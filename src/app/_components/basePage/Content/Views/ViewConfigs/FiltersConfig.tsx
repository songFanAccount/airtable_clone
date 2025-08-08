import { GoPlus as AddIcon } from "react-icons/go";
import { MdKeyboardArrowDown as DropdownIcon } from "react-icons/md";
import { ImTextColor as TextTypeIcon } from "react-icons/im";
import { FaHashtag as NumberTypeIcon } from "react-icons/fa";
import { HiOutlineTrash as DeleteIcon } from "react-icons/hi";
import { Loader2 as LoadingIcon } from "lucide-react";
import type { FieldsData, FilterData } from "../../../BasePage";
import { api } from "~/trpc/react";
import { FieldType, FilterJoinType, FilterOperator, Prisma } from "@prisma/client";
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { toastNoFunction } from "~/hooks/helpers";
import { useEffect, useState } from "react";
import { nanoid } from "nanoid";

export function getDefaultOperator(fieldType: FieldType) {
  return fieldType === FieldType.Text ? FilterOperator.CONTAINS : FilterOperator.GREATERTHAN
}
export function operatorToText(op: FilterOperator, inDropdown: boolean): string {
  switch (op) {
    case FilterOperator.CONTAINS:
      return `contains${inDropdown ? "..." : ""}`
    case FilterOperator.NOTCONTAINS:
      return `does not contain${inDropdown ? "..." : ""}`
    case FilterOperator.EQUALTO:
      return `is${inDropdown ? "..." : ""}`
    case FilterOperator.NOTEMPTY:
      return "is not empty"
    case FilterOperator.GREATERTHAN:
      return ">"
    case FilterOperator.SMALLERTHAN:
      return "<"
    default:
      return "is empty"
  }
}
const JoinType = ({ joinType, setJoinType } : { joinType: FilterJoinType, setJoinType: (joinType: FilterJoinType) => void }) => {
  function onChangeJoinType(newJoinType: FilterJoinType) {
    setJoinType(newJoinType)
  }
  return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <div className="flex flex-row min-w-[56px] w-[56px] cursor-pointer hover:bg-[#f2f2f2] pl-2 h-full items-center justify-between rounded-[3px] border-[1px] border-[#e5e5e5] border-box">
            <span className="flex-1">{joinType.toLowerCase()}</span>
            <div className="w-8 h-8 flex justify-center items-center">
              <DropdownIcon className="text-gray-600 w-4 h-4"/>
            </div>
          </div>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="bottom"
            align="start"
            className="
              w-[56px] bg-white rounded-md shadow-lg p-1 z-[51]
              border border-gray-200 text-[13px]
            "
          >
            {
              Object.values(FilterJoinType).map((type, index) => {
                return (
                  <DropdownMenu.Item
                    key={index}
                    className="flex flex-row h-8 items-center p-1 cursor-pointer outline-none hover:bg-[#f2f2f2] rounded-[3px]"
                    onClick={() => onChangeJoinType(type)}
                  >
                    <span>{type.toLowerCase()}</span>
                  </DropdownMenu.Item>
                )
              })
            }
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
  )
}

interface Props {
  viewId?: string,
  fields: FieldsData,
  filters?: FilterData[],
}
const FiltersConfig = ({viewId, fields, filters} : Props) => {
  const utils = api.useUtils()
  const [newFilters, setNewFilters] = useState<FilterData[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  useEffect(() => {
    if (filters) {
      setNewFilters(filters)
    }
  }, [filters])
  const { mutate: updateFilters, status } = api.base.updateFilters.useMutation({
    onSuccess: async (_) => {
      setDeletedIds([])
      await utils.base.getView.invalidate()
    }
  })
  const updatingFilters = status === "pending"
  const filtersToUpdate = filters ? newFilters.filter(filter => {
    const matchingFilter = filters.find(existingFilter => existingFilter.id === filter.id)
    if (matchingFilter) {
      return !(
        filter.joinType === matchingFilter.joinType &&
        filter.operator === matchingFilter.operator &&
        filter.fieldId === matchingFilter.fieldId &&
        filter.compareVal === matchingFilter.compareVal
      )
    } else return false
  }) : []
  const createdFilters = filters ? newFilters.filter(filter => !filters.some(existingFilter => filter.id === existingFilter.id)) : []
  const hasUpdates = !(filtersToUpdate.length === 0 && createdFilters.length === 0 && deletedIds.length === 0)
  function onUpdateFilters() {
    if (!viewId || !filters || !hasUpdates) return
    updateFilters({viewId, filtersToUpdate, createdFilters, deletedIds})
  }
  function onAddFilter() {
    if (updatingFilters) return
    if (viewId && fields?.[0]) {
      const field = fields[0]
      const newFilter = {
        id: nanoid(10),
        joinType: FilterJoinType.AND,
        viewId: viewId,
        fieldId: field.id,
        operator: getDefaultOperator(field.type),
        compareVal: ""
      } as FilterData
      setNewFilters(prev => [...prev, newFilter])
    }
  }
  function onDeleteFilter(filterId: string) {
    if (updatingFilters) return
    setNewFilters(newFilters.filter(filter => filter.id !== filterId))
    if (filters?.some(filter => filter.id === filterId)) setDeletedIds(prev => [...prev, filterId])
  }
  function onChangeField(filterId: string, newFieldId: string, newFieldType: FieldType, sameType: boolean) {
    if (updatingFilters) return
    const updatedFilter: Prisma.FilterUncheckedUpdateInput = {fieldId: newFieldId}
    if (!sameType) {
      updatedFilter.compareVal = ""
      updatedFilter.operator = getDefaultOperator(newFieldType)
    }
    setNewFilters(prev => prev.map(filter => {
      if (filter.id !== filterId) return filter
      const newFilter: FilterData = {...filter, ...updatedFilter as FilterData}
      return newFilter
    }))
  }
  function onChangeOperator(filterId: string, newOperator: FilterOperator) {
    if (updatingFilters) return
    setNewFilters(prev => prev.map(filter => {
      if (filter.id !== filterId) return filter
      const updatedFilter: FilterData = {...filter, operator: newOperator}
      if (newOperator === FilterOperator.EMPTY || newOperator === FilterOperator.NOTEMPTY) updatedFilter.compareVal = ""
      return updatedFilter
    }))
  }
  function onChangeJoinType(filterId: string, newJoinType: FilterJoinType) {
    if (updatingFilters) return
    setNewFilters(prev => prev.map(filter => {
      if (filter.id !== filterId) return filter
      const updatedFilter: FilterData = {...filter, joinType: newJoinType}
      return updatedFilter
    }))
  }
  const numberOps: FilterOperator[] = [FilterOperator.GREATERTHAN, FilterOperator.SMALLERTHAN]
  const textOps: FilterOperator[] = Object.values(FilterOperator).filter(op => !numberOps.includes(op))
  return (newFilters && newFilters.length > 0)
    ?
      <div className="flex flex-col gap-3"
        style={{
          opacity: updatingFilters ? 0.7 : 1
        }}
      >
        <span className="text-gray-600">In this view, show records</span>
        <div className="flex flex-col gap-2">
          {
            newFilters.map((filter, index) => {
              const currentField = fields?.find(field => field.id === filter.fieldId)
              const operators: FilterOperator[] = currentField?.type === FieldType.Number ? numberOps : textOps
              return (
                <div key={index} className="flex flex-row h-8 px-2 gap-2">
                  <JoinType joinType={filter.joinType} setJoinType={(joinType) => onChangeJoinType(filter.id, joinType)}/>
                  <div className="flex flex-row h-full w-fit border-[1px] border-[#e5e5e5] rounded-[3px] border-box">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <div className="flex flex-row w-[130px] max-w-[130px] cursor-pointer hover:bg-[#f2f2f2] pl-2 h-full items-center justify-between border-r-[1px] border-[#e5e5e5] border-box">
                          <span className="flex-1 truncate">{currentField?.name}</span>
                          <div className="w-8 h-8 flex justify-center items-center">
                            <DropdownIcon className="text-gray-600 w-4 h-4"/>
                          </div>
                        </div>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          side="bottom"
                          align="start"
                          className="
                            w-[240px] bg-white rounded-md shadow-lg px-3 py-2 z-[51]
                            border border-gray-200 relative top-1 text-[13px]
                          "
                        >
                          {
                            fields?.map((field, index) => {
                              const isCurrentField = currentField?.id === field.id
                              return (
                                <DropdownMenu.Item key={index}
                                  className="flex flex-row h-8 items-center p-2 cursor-pointer hover:bg-[#f2f2f2] outline-none rounded-[3px]"
                                  style={{
                                    background: isCurrentField ? "#f2f2f2" : undefined
                                  }}
                                  onClick={() => onChangeField(filter.id, field.id, field.type, currentField?.type === field.type)}
                                >
                                  <div className="flex flex-row gap-[6px] items-center">
                                    <div className="flex justify-center items-center w-4 h-4">
                                      {
                                        field.type === FieldType.Text
                                        ?
                                          <TextTypeIcon className="w-4 h-4"/>
                                        :
                                          <NumberTypeIcon className="w-3 h-3"/>
                                      }
                                    </div>
                                    <span>{field.name}</span>
                                  </div>
                                </DropdownMenu.Item>
                              )
                            })
                          }
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <div className="flex flex-row w-[130px] max-w-[130px] cursor-pointer hover:bg-[#f2f2f2] pl-2 h-full items-center justify-between border-r-[1px] border-[#e5e5e5] border-box">
                          <span className="flex-1 truncate">{operatorToText(filter.operator, true)}</span>
                          <div className="w-8 h-8 flex justify-center items-center">
                            <DropdownIcon className="text-gray-600 w-4 h-4"/>
                          </div>
                        </div>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          side="bottom"
                          align="start"
                          className="
                            w-[240px] bg-white rounded-md shadow-lg px-3 py-2 z-[51]
                            border border-gray-200 relative top-1 text-[13px]
                          "
                        >
                          {
                            operators.map((operator, index) => {
                              const isCurrentOp = operator === filter.operator
                              return (
                                <DropdownMenu.Item key={index}
                                  className="flex flex-row h-8 items-center p-2 cursor-pointer hover:bg-[#f2f2f2] rounded-[3px]"
                                  style={{
                                    background: isCurrentOp ? "#f2f2f2" : undefined
                                  }}
                                  onClick={() => onChangeOperator(filter.id, operator)}
                                >
                                  <div className="flex flex-row gap-[6px] items-center">
                                    <span>{operatorToText(operator, false)}</span>
                                  </div>
                                </DropdownMenu.Item>
                              )
                            })
                          }
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                    <div className="flex flex-row w-[130px] max-w-[130px] py-[2px] gap-2 h-full items-center justify-between border-r-[1px] border-[#e5e5e5] border-box">
                      {
                        (filter.operator === FilterOperator.EMPTY || filter.operator === FilterOperator.NOTEMPTY)
                        ?
                          <></>
                        :
                          <input
                            type={currentField?.type === FieldType.Text ? "text" : "number"}
                            placeholder="Enter a value"
                            value={filter.compareVal}
                            autoFocus={false}
                            onChange={(e) => {
                              if (updatingFilters) return
                              const newVal = e.target.value
                              setNewFilters(prev => prev.map(newFilter => {
                                if (newFilter.id !== filter.id) return newFilter
                                return {
                                  ...newFilter,
                                  compareVal: newVal
                                }
                              }))
                            }}
                            className="outline-[0px] h-full w-full px-[6px] focus:outline-[3px] focus:outline-gray-400 rounded-[2px]
                              [appearance:textfield]
                              [&::-webkit-outer-spin-button]:appearance-none
                              [&::-webkit-inner-spin-button]:appearance-none
                            "
                          />
                      }
                    </div>
                    <button className="w-8 h-8 flex justify-center items-center cursor-pointer hover:bg-[#f2f2f2]"
                      onClick={() => onDeleteFilter(filter.id)}
                    >
                      <DeleteIcon className="w-4 h-4 text-gray-600"/>
                    </button>
                  </div>
                </div>
              )
            })
          }
        </div>
        <div className="flex flex-row w-full justify-between items-center">
          <div className="flex flex-row gap-3 h-[34px]">
            <button className="flex flex-row h-full w-fit gap-[2px] cursor-pointer items-center text-gray-600 group"
              onClick={onAddFilter}
            >
              <AddIcon className="w-[14px] h-[14px] group-hover:text-black"/>
              <span className="font-[500] group-hover:text-black">Add condition</span>
            </button>
            <button className="flex flex-row h-full w-fit gap-[2px] cursor-pointer items-center text-gray-600 group"
              onClick={toastNoFunction}
            >
              <AddIcon className="w-[14px] h-[14px] group-hover:text-black"/>
              <span className="font-[500] group-hover:text-black">Add condition group</span>
            </button>
          </div>
          {
            updatingFilters
            ?
            <div className="flex flex-row gap-2 items-center">
              <div className="flex flex-row gap-2 items-center">
                <span className="text-[12px]">Applying changes</span>
                <LoadingIcon className="w-4 h-4 animate-spin"/>
              </div>
            </div>
            : 
              hasUpdates
              ?
                <button className="flex justify-center items-center h-7 px-3 border rounded-[6px] hover:bg-black hover:text-white cursor-pointer"
                  style={{
                    borderColor: "hsl(202, 10%, 88%)",
                  }}
                  onClick={onUpdateFilters}
                >
                  <span className="text-[13px]">Apply filters</span>
                </button>
              :
                <></>
          }
        </div>
      </div>
    :
      <div className="flex flex-col gap-4">
        <span className="text-gray-500">No filter conditions are applied</span>
        <div className="flex flex-row justify-between items-center w-[240px]">
          <button className="flex flex-row w-fit gap-1 cursor-pointer items-center text-gray-600 group"
            onClick={onAddFilter}
            >
            <AddIcon className="w-[14px] h-[14px] group-hover:text-black"/>
            <span className="font-[500] group-hover:text-black">Add condition</span>
          </button>
          {
            hasUpdates &&
            <button className="flex justify-center items-center h-7 px-3 border rounded-[6px] hover:bg-black hover:text-white cursor-pointer"
              style={{
                borderColor: "hsl(202, 10%, 88%)",
              }}
              onClick={onUpdateFilters}
              >
              <span className="text-[13px]">Apply filters</span>
            </button>
          }
        </div>
      </div>
}
export default FiltersConfig