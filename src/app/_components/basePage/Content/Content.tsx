import { useRouter } from "next/navigation"
import type { BaseData, TableData, TablesData, ViewData, ViewsData } from "../BasePage"
import TableTabs from "./TableTabs"
import Views from "./Views/Views"

const Content = ({ baseData, currentTable, views, currentView } : { baseData: BaseData, currentTable: TableData, views: ViewsData, currentView: ViewData }) => {
  const tables: TablesData = baseData?.tables
  const router = useRouter()
  function navToView(viewId: string) {
    const baseId = baseData?.id
    const tableId = currentTable?.id
    if (baseId && tableId) router.push(`/base/${baseId}/${tableId}/${viewId}`)
  }
  return (
    <div className="h-full w-full bg-white overflow-x-hidden overflow-y-hidden">
      <TableTabs baseId={baseData?.id} tablesData={tables} currentTable={currentTable}/>
      <Views tableData={currentTable} views={views} currentView={currentView} navToView={navToView}/>
    </div>
  )
}
export default Content