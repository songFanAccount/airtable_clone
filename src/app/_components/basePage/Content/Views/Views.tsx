import { useEffect, useState } from "react"
import type { RecordsData, TableData, ViewsData } from "../../BasePage"
import Header from "./Header"
import SlidingSidebar from "./SlidingSidebar"
import View from "./View/View"
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { api } from "~/trpc/react"
import { useParams } from "next/navigation"

const Views = ({ tableData, views, navToView } : { tableData: TableData, views: ViewsData, navToView: (viewId: string) => void }) => {
  const {viewId} = useParams()
  const currentViewId = viewId as string
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)
  const utils = api.useUtils()
  /* 
  View configs stuff
  */
  const { data: viewData } = api.base.getView.useQuery({ viewId: currentViewId ?? "" }, {
    enabled: !!tableData?.id && !!currentViewId,
  })
  // End configs stuff
  const [searchStr, setSearchStr] = useState<string>("")
  const { data: searchData, isFetching: searching } = api.base.searchInView.useQuery({ viewId: currentViewId ?? "", searchStr: searchStr.trim() }, {
    enabled: !!tableData?.id && !!currentViewId && searchStr.trim() !== ""
  })
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null)
  const [foundIndex, setFoundIndex] = useState<number | undefined>(undefined)
  function moveFoundIndex(direction: 1 | -1) {
    if (foundIndex === undefined) return
    let newFoundIndex = foundIndex + direction
    if (newFoundIndex < 0) newFoundIndex = numFoundCells - 1
    else if (newFoundIndex >= numFoundCells) newFoundIndex = 0
    setFoundIndex(newFoundIndex)
  }
  const [foundRecords, setFoundRecords] = useState<RecordsData>([])
  const [numFoundCells, setNumFoundCells] = useState<number>(0)
  const [searchNum, setSearchNum] = useState<number>(0)
  useEffect(() => {
    const trimmed = searchStr.trim()
    if (trimmed !== "") {
      if (searchTimer) clearTimeout(searchTimer)
      const newTimer = setTimeout(() => {
        void utils.base.searchInView.invalidate()
      }, 1000)
      setSearchTimer(newTimer)
    } else {
      setFoundRecords([])
      setNumFoundCells(0)
      setFoundIndex(undefined)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchStr])
  useEffect(() => {
    if (!searching && searchData) {
      setFoundRecords(searchData.records)
      let numCells = 0
      searchData.records.forEach(record => numCells += record.cells?.length ?? 0)
      setNumFoundCells(numCells)
      setFoundIndex(0)
      setSearchNum(prev => prev + 1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searching])
  return (
    <Dialog.Root open={sidebarOpen} onOpenChange={setSidebarOpen} modal={false}>
      <div className="h-full w-full flex flex-col">
        <Header viewData={viewData} fields={tableData?.fields} searchStr={searchStr} searching={searching} setSearchStr={setSearchStr} foundIndex={foundIndex ?? 0} numSearchFound={numFoundCells} moveFoundIndex={moveFoundIndex}/>
        <div className="h-full w-full flex flex-row relative">
          <Dialog.Content onOpenAutoFocus={(e) => e.preventDefault()} className="w-[279px] border-r-[1px] border-box px-2 py-[10px] flex-shrink-0"
            style={{
              borderRightColor: "#dfe2e4",
            }}
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <VisuallyHidden>
              <Dialog.Title>Views Sidebar</Dialog.Title>
            </VisuallyHidden>
            <SlidingSidebar views={views} currentView={viewData} navToView={navToView}/>
          </Dialog.Content>
          {viewData && <View tableData={tableData} view={viewData} searchStr={searchStr} foundIndex={foundIndex} foundRecords={foundRecords} searchNum={searchNum}/>}
        </div>
      </div>
    </Dialog.Root>
  )
}
export default Views