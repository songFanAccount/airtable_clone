import { useRouter } from "next/navigation";
import { FaReact as OmniIcon } from "react-icons/fa";
import { QuestionMarkCircleIcon, BellIcon } from "@heroicons/react/24/outline";
import { IoArrowBackOutline as HomeIcon } from "react-icons/io5";
import { toastNoUI, toastNoWay } from "~/hooks/helpers";
import { useState } from "react";
import ProfileButton from "../../homePage/Header/ProfileButton";

const Sidebar = () => {
  const router = useRouter()
  const [homeHovered, setHomeHovered] = useState<boolean>(false)
  const [helpHovered, setHelpHovered] = useState<boolean>(false)
  const [notiHovered, setNotiHovered] = useState<boolean>(false)
  return (
    <div className="flex flex-col justify-between items-center h-full py-4 px-2 border-r w-[55px] min-w-[55px] bg-white" style={{ borderColor: "hsl(202, 10%, 88%)" }}>
      <div className="flex flex-col items-center gap-4">
        <button className="cursor-pointer"
          onClick={() => router.push("/")}
          onMouseEnter={() => setHomeHovered(true)}
          onMouseLeave={() => setHomeHovered(false)}
        >
          {
            homeHovered
            ?
              <div className="flex justify-center items-center h-6 w-6">
                <HomeIcon className="h-4 w-4" />
              </div>
            :
              <img src="/assets/airtable_base.svg" alt="Airtable Base" className="h-6 w-6" />
          }
        </button>
        <button className="cursor-pointer"
          onClick={toastNoWay}
        >
          <OmniIcon className="w-6 h-6 flex-shrink"/>
        </button>
      </div>
      <div className="flex flex-col items-center gap-3">
        <button className="flex justify-center items-center w-7 h-7 rounded-full cursor-pointer"
          onMouseEnter={() => setHelpHovered(true)}
          onMouseLeave={() => setHelpHovered(false)}
          style={{
            backgroundColor: helpHovered ? "#e5e9f0" : undefined,
          }}
          onClick={toastNoUI}
        >
          <QuestionMarkCircleIcon className="w-4 h-4 flex-shrink-0"/>
        </button>
        <button className="flex justify-center items-center w-7 h-7 rounded-full cursor-pointer"
          onMouseEnter={() => setNotiHovered(true)}
          onMouseLeave={() => setNotiHovered(false)}
          style={{
            backgroundColor: notiHovered ? "#e5e9f0" : undefined,
          }}
          onClick={toastNoUI}
        >
          <BellIcon className="w-4 h-4 flex-shrink-0"/>
        </button>
        <div className="flex justify-center items-center w-7 h-7 flex-shrink-0">
          <ProfileButton inHeader={false}/>
        </div>
      </div>
    </div>
  )
}
export default Sidebar