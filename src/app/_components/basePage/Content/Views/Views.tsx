import { useEffect, useState } from "react"
import type { TableData, ViewData, ViewsData } from "../../BasePage"
import Header from "./Header"
import SlidingSidebar from "./SlidingSidebar"
import View from "./View/View"
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { api } from "~/trpc/react"

const Views = ({ tableData, views, currentView, navToView } : { tableData: TableData, views: ViewsData, currentView: ViewData, navToView: (viewId: string) => void }) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)
  /* 
  View configs stuff
  */
 const { data: viewData, isFetching: fetchingView } = api.base.getView.useQuery({ viewId: currentView?.id ?? "" }, {
   enabled: !!tableData?.id && !!currentView?.id
 })
  const [viewLoaded, setViewLoaded] = useState<boolean>(false)
  useEffect(() => {
    if (viewData) {
      setViewLoaded(true)
    }
  }, [viewData])
  // End configs stuff
  return (
    <Dialog.Root open={sidebarOpen} onOpenChange={setSidebarOpen} modal={false}>
      <div className="h-full w-full flex flex-col">
        <Header viewData={viewData} fields={tableData?.fields}/>
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
            <SlidingSidebar views={views} currentView={currentView} navToView={navToView}/>
          </Dialog.Content>
          <View tableData={tableData}/>
        </div>
      </div>
    </Dialog.Root>
  )
}
export default Views