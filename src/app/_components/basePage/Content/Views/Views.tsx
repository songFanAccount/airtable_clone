import type { ViewData } from "../../BasePage"
import Header from "./Header"

const Views = ({ currentView } : { currentView: ViewData }) => {
  return (
    <div className="h-full w-full flex flex-col">
      <Header currentView={currentView}/>
    </div>
  )
}
export default Views