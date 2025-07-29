import { MdKeyboardArrowDown as DropdownIcon } from "react-icons/md";
import { Loader2 as LoadingIcon } from "lucide-react";
import { GoPlus as AddTableIcon } from "react-icons/go";
import { toastNoUI } from "~/hooks/helpers";
import type { TableData, TablesData } from "../BasePage";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
const TableTabs = ({ baseId, tablesData, currentTable } : { baseId?: string, tablesData: TablesData, currentTable: TableData }) => {
  const router = useRouter()
  const utils = api.useUtils()
  const { mutate: addNewTable, status } = api.base.addNewTable.useMutation({
    onSuccess: async (createdTable) => {
      if (createdTable) {
        await utils.base.getAllFromBase.invalidate()
        console.log(createdTable)
        const newTableId = createdTable.id
        const defaultViewId = createdTable.lastOpenedViewId
        if (newTableId && defaultViewId) router.push(`/base/${baseId}/${newTableId}/${defaultViewId}`)
      }
    }
  })
  function createNewTable() {
    if (baseId && tablesData) {
      addNewTable({ newName: `Table ${tablesData.length + 1}`, baseId: baseId })
    }
  }
  function onClickTableTab(tableData: TableData) {
    if (tableData) router.push(`/base/${baseId}/${tableData.id}/${tableData.lastOpenedViewId}`)
  }
  return (
    <div className="h-8 bg-[#fff1ff] text-[13px] border-b-[1px] border-box flex flex-row justify-between items-center"
      style={{
        borderColor: "hsl(202, 10%, 88%)"
      }}
    >
      <div className="h-full overflow-y-hidden overflow-x-hidden">
        {
          tablesData
          ?
            <div className="flex flex-row items-center h-full text-gray-600 flex-shrink-0">
              <div className="flex flex-row items-center h-full max-w-[500px] truncate">
                {
                  tablesData.map((tableData, index) => {
                    const tableName = tableData.name
                    const isCurrentTable = currentTable?.id === tableData.id
                    return (
                      isCurrentTable
                      ?
                        <button key={index} className="flex-shrink-0 h-[calc(100%+1px)] px-3 font-[500] text-black bg-white border-box border-t-[1px] border-r-[1px] rounded-[6px] cursor-pointer"
                          style={{
                            borderColor: "hsl(202, 10%, 88%)",
                            borderLeftWidth: index === 0 ? 0 : "1px",
                            borderTopLeftRadius: index === 0 ? 0 : "6px",
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                          }}
                        >
                          <div className="flex flex-row items-center gap-1">
                            <span>{tableName}</span>
                            <DropdownIcon className="text-[16px] text-gray-600"/>
                          </div>
                        </button>
                      :
                        <div key={index} className="flex-shrink-0 h-full flex flex-row items-center hover:bg-[#ebdeeb]">
                          <button  className="h-full px-3 text-gray-600 cursor-pointer hover:text-black"
                            onClick={() => onClickTableTab(tableData)}
                          >
                            <span>{tableName}</span>
                          </button>
                          <div className="h-[12px] w-[1px] bg-gray-300 relative left-[1px]"/> 
                        </div>
                    )
                  })
                }
              </div>
              <div className="flex flex-row items-center flex-shrink-0">
                <button className="mx-3 cursor-pointer" onClick={toastNoUI}>
                  <DropdownIcon className="text-[16px]"/>
                </button>
                <button className="flex flex-row group items-center gap-2 px-3 cursor-pointer"
                  onClick={createNewTable}
                >
                  <AddTableIcon className="w-5 h-5 group-hover:text-black"/>
                  <span className="mt-[1px] group-hover:text-black">Add new table</span>
                </button>
              </div>
            </div>
          :
            <LoadingIcon className="w-4 h-4 animate-spin ml-3"/>
        }
      </div>
      <button className="flex flex-row group items-center cursor-pointer gap-1 px-3 text-gray-600" onClick={toastNoUI}>
        <span className="text-[13px] group-hover:text-[rgb(29,31,37)]">Tools</span>
        <DropdownIcon className="text-[16px] group-hover:text-[rgb(29,31,37)]"/>
      </button>
    </div>
  )
}
export default TableTabs