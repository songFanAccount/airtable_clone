import type { TableData, ViewData } from "../../../BasePage"
import ColumnHeadings from "./ColumnHeadings"

const View = ({ tableData, currentView } : { tableData: TableData, currentView: ViewData }) => {
  return (
    <div className="flex flex-col w-full h-full text-[13px]">
      <ColumnHeadings fields={tableData?.fields}/>
    </div>
  )
}
export default View