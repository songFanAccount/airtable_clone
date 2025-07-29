import { useState } from "react"
import type { ViewData, ViewsData } from "../../BasePage"
import Header from "./Header"
import SlidingSidebar from "./SlidingSidebar"
import View from "./View"
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const Views = ({ views, currentView, navToView } : { views: ViewsData, currentView: ViewData, navToView: (viewId: string) => void }) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)
  return (
    <Dialog.Root open={sidebarOpen} onOpenChange={setSidebarOpen} modal={false}>
      <div className="h-full w-full flex flex-col">
        <Header currentView={currentView}/>
        <div className="h-full w-full flex flex-row relative">
          <Dialog.Content className="w-[279px] border-r-[1px] border-t-[1.5px] border-box px-2 py-[10px]"
            style={{
              borderRightColor: "#f5f5f5",
              borderTopColor: "#f5f5f5",
            }}
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <VisuallyHidden>
              <Dialog.Title>Views Sidebar</Dialog.Title>
            </VisuallyHidden>
            <SlidingSidebar views={views} currentView={currentView} navToView={navToView}/>
          </Dialog.Content>
          <View/>
        </div>
      </div>
    </Dialog.Root>
  )
}
export default Views