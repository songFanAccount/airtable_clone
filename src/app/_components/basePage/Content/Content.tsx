import type { BaseData, TableData, TablesData, ViewData } from "../BasePage"
import TableTabs from "./TableTabs"
import Views from "./Views/Views"

const Content = ({ baseData, currentTable, currentView } : { baseData: BaseData, currentTable: TableData, currentView: ViewData }) => {
  const tables: TablesData = baseData?.tables
  return (
    <div className="h-full w-full bg-white overflow-x-hidden overflow-y-hidden">
      <TableTabs baseId={baseData?.id} tablesData={tables} currentTable={currentTable}/>
      <Views currentView={currentView}/>
    </div>
  )
}
export default Content