import type { SidebarButtonInfo } from "./CreatedBasesSection"
import { IoBookOutline as TemplatesIcon } from "react-icons/io5";
import { PiShoppingBagOpen as MarketplaceIcon } from "react-icons/pi";
import { TbWorld as ImportCollapsedIcon } from "react-icons/tb";
import { FiPlus as CreateIcon } from "react-icons/fi";

const CreateNewBasesSection = () => {
  const buttons: SidebarButtonInfo[] = [
    {
      icon: TemplatesIcon,
      buttonText: "Templates and apps"
    },
    {
      icon: MarketplaceIcon,
      buttonText: "Marketplace"
    },
    {
      icon: ImportCollapsedIcon,
      buttonText: "Import"
    },
  ]
  return (
    <div className="flex flex-col items-center">
      <div className="w-[22px] h-[1px] bg-[#0000001A] mb-[18px]"/>
      {
        buttons.map((SidebarButtonInfo, index) => {
          const Icon = SidebarButtonInfo.icon
          const dim = SidebarButtonInfo.dim ?? 4
          return (
            <Icon key={index} className={`w-${dim} h-${dim} flex-shrink-0 mb-[18px] text-gray-400`}/>
          )
        })
      }
      <div className="flex justify-center items-center border rounded-[3px] w-[22px] text-gray-400 h-[22px] flex-shrink-0"
        style={{
          boxShadow: "0px 0px 1px rgba(0, 0, 0, 0.32), 0px 0px 2px rgba(0, 0, 0, 0.08), 0px 1px 3px rgba(0, 0, 0, 0.08)",
          borderColor: "hsl(202, 10%, 88%)"
        }}
      >
        <CreateIcon/>
      </div>
    </div>
  )
}
export default CreateNewBasesSection