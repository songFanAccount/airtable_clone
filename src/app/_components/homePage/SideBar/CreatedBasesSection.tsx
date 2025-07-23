import { HomeIcon, StarIcon } from "@heroicons/react/24/outline"
import { PiShare as SharedIcon } from "react-icons/pi";
import { HiOutlineUserGroup as WorkspacesIcon } from "react-icons/hi2";
interface ButtonInfo {
  icon: React.ElementType,
  buttonText: string,
  dim?: number
}
const CreatedBasesSection = () => {
  const buttons: ButtonInfo[] = [
    {
      icon: HomeIcon,
      buttonText: "Home"
    },
    {
      icon: StarIcon,
      buttonText: "Starred"
    },
    {
      icon: SharedIcon,
      buttonText: "Shared",
    },
    {
      icon: WorkspacesIcon,
      buttonText: "Workspaces"
    },
  ]
  return (
    <div className="flex flex-col">
      {
        buttons.map((buttonInfo, index) => {
          const Icon = buttonInfo.icon
          const dim = buttonInfo.dim ? buttonInfo.dim : 5
          return (
            <Icon key={index} className={`w-${dim} h-${dim} flex-shrink-0 mb-5`}/>
          )
        })
      }
      <div className="w-[22px] h-[1px] bg-[#0000001A]"/>
    </div>
  )
}
export default CreatedBasesSection