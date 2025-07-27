import { QuestionMarkCircleIcon, BellIcon } from "@heroicons/react/24/outline";
import ProfileButton from "./ProfileButton";
import { useEffect, useState } from "react";
import { toastNoUI } from "~/hooks/helpers";
import { signIn, useSession } from "next-auth/react";
const InfoCorner = () => {
  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [helpHovered, setHelpHovered] = useState<boolean>(false)
  const [notiHovered, setNotiHovered] = useState<boolean>(false)
  const { data: session } = useSession()
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    handleResize()
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <div className="flex items-center justify-end h-full w-full min-w-[170px]">
      <div className="flex flex-row items-center">
        <button className="rounded-full h-7 flex justify-center items-center cursor-pointer"
          onMouseEnter={() => setHelpHovered(true)}
          onMouseLeave={() => setHelpHovered(false)}
          style={{
            backgroundColor: helpHovered ? "#e5e5e5" : undefined
          }}
          onClick={toastNoUI}
        >
          {
            screenWidth < 1460
            ?
              <div className="flex justify-center items-center w-7 h-7">
                <QuestionMarkCircleIcon className="w-4 h-4 flex-shrink-0"/>
              </div>
            :
              <div className="flex flex-row items-center px-3">
                <QuestionMarkCircleIcon className="w-4 h-4 flex-shrink-0"/>
                <p className="ml-1 text-[13px]">Help</p>
              </div>
          }
        </button>
        <button className="flex justify-center items-center w-7 h-7 border rounded-full mx-[0.75rem] cursor-pointer"
          onMouseEnter={() => setNotiHovered(true)}
          onMouseLeave={() => setNotiHovered(false)}
          style={{
            backgroundColor: notiHovered ? "#e5e9f0" : undefined,
            borderColor: "hsl(202, 10%, 88%)"
          }}
          onClick={toastNoUI}
        >
          <BellIcon className="w-4 h-4 flex-shrink-0"/>
        </button>
      </div>
      {
        session?.user
        ?
          <div className="flex justify-center items-center ml-2 w-7 h-7 flex-shrink-0">
            <ProfileButton/>
          </div>
        :
          <button className="flex justify-center items-center h-7 px-3 border rounded-[6px] hover:bg-black hover:text-white cursor-pointer"
            style={{
              borderColor: "hsl(202, 10%, 88%)",
            }}
            onClick={() => signIn("google")}
          >
            <span className="text-[13px]">Log in</span>
          </button>
      }
    </div>
  );
};

export default InfoCorner;