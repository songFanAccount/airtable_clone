import { FieldType, SortOperator } from "@prisma/client"
import type { FieldsData, SortData } from "../../../BasePage"
import { ImTextColor as TextTypeIcon } from "react-icons/im";
import { FaHashtag as NumberTypeIcon } from "react-icons/fa";
import { api } from "~/trpc/react";
import * as Popover from "@radix-ui/react-popover";
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MdKeyboardArrowDown as DropdownIcon } from "react-icons/md";
import { RxCross2 as DeleteIcon } from "react-icons/rx";
import { GoPlus as AddIcon } from "react-icons/go";
import { useState } from "react";

interface Props {
  viewId?: string,
  fields: FieldsData,
  sorts?: SortData[]
}

const SortsConfig = ({ viewId, fields, sorts } : Props) => {
  const utils = api.useUtils()
  const { mutate: addSort } = api.base.addSort.useMutation({
    onSuccess: async (_) => {
      await utils.base.getView.invalidate()
    }
  })
  function onAddSort(fieldId: string) {
    if (viewId) addSort({viewId, fieldId})
  }
  const { mutate: changeSortField } = api.base.changeSortField.useMutation({
    onSuccess: async (_) => {
      await utils.base.getView.invalidate()
    }
  })
  function onChangeSortField(sortId: string, fieldId: string) {
    changeSortField({sortId, fieldId})
  }
  const { mutate: changeSortOperator } = api.base.changeSortOperator.useMutation({
    onSuccess: async (_) => {
      await utils.base.getView.invalidate()
    }
  })
  function onChangeSortOperator(sortId: string, operator: SortOperator) {
    changeSortOperator({sortId, operator})
  }
  const { mutate: deleteSort } = api.base.deleteSort.useMutation({
    onSuccess: async (_) => {
      await utils.base.getView.invalidate()
    }
  })
  function onDeleteSort(sortId: string) {
    deleteSort({sortId})
  }
  const sortedFieldIds = sorts?.map(sort => sort.fieldId)
  const unsortedFields = fields?.filter(field => !sortedFieldIds?.includes(field.id))
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false)
  return (
    <div className="flex flex-col gap-4 text-[13px]">
      <span className="font-[500] text-gray-600 pb-2 border-b-[1px] border-[#e5e5e5]">Sort by</span>
      {
        (sorts && sorts.length > 0)
        ?
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              {
                sorts.map((sort, index) => {
                  const field = fields?.find(field => field.id === sort.fieldId)
                  const startChar = field?.type === FieldType.Text ? sort.operator === SortOperator.INCREASING ? 'A' : 'Z' : sort.operator === SortOperator.INCREASING ? "1" : "9"
                  const endChar = field?.type === FieldType.Text ? sort.operator === SortOperator.INCREASING ? 'Z' : 'A' : sort.operator === SortOperator.INCREASING ? "9" : "1"
                  const sortStr = `${startChar} → ${endChar}`
                  return (
                    <div key={index} className="flex flex-row items-center h-7 w-full gap-3">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <div className="flex flex-row min-w-[240px] w-[240px] cursor-pointer hover:bg-[#f2f2f2] pl-2 h-full items-center justify-between rounded-[3px] border-[1px] border-[#e5e5e5] border-box">
                            <span className="flex-1">{field?.name}</span>
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
                              w-[240px] bg-white rounded-md shadow-lg z-[51]
                              border border-gray-200 text-[13px]
                            "
                          >
                            {
                              unsortedFields?.map((field, index) => {
                                const Icon = field.type === FieldType.Text ? TextTypeIcon : NumberTypeIcon
                                const dim = field.type === FieldType.Text ? "16px" : "12px"
                                return (
                                  <DropdownMenu.Item key={index} className="flex flex-row px-2 text-gray-700 items-center h-9 cursor-pointer hover:bg-[#f2f2f2]"
                                    onClick={() => onChangeSortField(sort.id, field.id)}
                                  >
                                    <div className="w-4 h-4 mr-2 flex justify-center items-center">
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
                                  </DropdownMenu.Item>
                                )
                              })
                            }
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <div className="flex flex-row flex-1 cursor-pointer hover:bg-[#f2f2f2] pl-2 h-full items-center justify-between rounded-[3px] border-[1px] border-[#e5e5e5] border-box">
                            <span className="flex-1">{sortStr}</span>
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
                              w-[156px] bg-white rounded-md shadow-lg z-[51]
                              border border-gray-200 text-[13px]
                            "
                          >
                            {[SortOperator.INCREASING, SortOperator.DECREASING].map((op, index) => {
                              return (
                                <DropdownMenu.Item key={index} className="flex flex-row px-2 text-gray-700 items-center h-9 cursor-pointer hover:bg-[#f2f2f2]"
                                  style={{
                                    backgroundColor: op === sort.operator ? "#f2f2f2" : undefined
                                  }}
                                  onClick={() => onChangeSortOperator(sort.id, op)}
                                >
                                  <span>{op === SortOperator.INCREASING ? `${startChar} → ${endChar}` : `${endChar} → ${startChar}`}</span>
                                </DropdownMenu.Item>
                              )
                            })}
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                      <button className="w-7 h-7 rounded-[3px] text-gray-600 hover:text-gray-800 flex justify-center items-center cursor-pointer hover:bg-[#f2f2f2]"
                        onClick={() => onDeleteSort(sort.id)}
                      >
                        <DeleteIcon className="w-5 h-5"/>
                      </button>
                    </div>
                  )
                })
              }
            </div>
            {unsortedFields && unsortedFields.length > 0 &&
              <Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
                <Popover.Trigger asChild>
                  <button className="flex flex-row h-8 w-fit gap-2 cursor-pointer items-center text-gray-600 group"
                    onClick={() => setPopoverOpen(!popoverOpen)}
                  >
                    <AddIcon className="w-[18px] h-[18px] group-hover:text-black"/>
                    <span className="group-hover:text-black">Add another sort</span>
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    side="bottom"
                    align="start"
                    className="bg-white rounded-[6px] w-fit z-50 text-[13px] overflow-clip"
                    style={{
                      boxShadow: "0 4px 16px 0 rgba(0, 0, 0, .25)",
                      width: `448px`
                    }}
                  >
                    <div className="flex flex-col">
                      {
                        unsortedFields?.map((field, index) => {
                          const Icon = field.type === FieldType.Text ? TextTypeIcon : NumberTypeIcon
                          const dim = field.type === FieldType.Text ? "16px" : "12px"
                          return (
                            <div key={index} className="flex flex-row px-2 text-gray-700 items-center h-9 cursor-pointer hover:bg-[#f2f2f2]"
                              onClick={() => {onAddSort(field.id); setPopoverOpen(false)}}
                            >
                              <div className="w-4 h-4 mr-2 flex justify-center items-center">
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
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            }
          </div>
        :
          <div className="flex flex-col gap-1">
            {
              fields?.map((field, index) => {
                const Icon = field.type === FieldType.Text ? TextTypeIcon : NumberTypeIcon
                const dim = field.type === FieldType.Text ? "16px" : "12px"
                return (
                  <div key={index} className="flex flex-row px-1 py-2 text-gray-700 items-center h-[26px] cursor-pointer hover:bg-[#f2f2f2] rounded-[3px]"
                    onClick={() => onAddSort(field.id)}
                  >
                    <div className="w-4 h-4 mr-2 flex justify-center items-center">
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
          </div>
    }
    </div>
  )
}
export default SortsConfig