import { useRef, useState } from "react";
import { Popover } from "../../Components";
import { signOut } from "next-auth/react";
import { MdLogout as LogoutIcon } from "react-icons/md";

const ProfileButton = () => {
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button className="flex justify-center items-center w-[26px] h-[26px] rounded-full bg-[#ffba05] cursor-pointer"
        onClick={() => setModalOpen(!modalOpen)}
        ref={buttonRef}
      >
        <div className="text-[13px] pt-0.5">
          D
        </div>
      </button>
      <Popover isOpen={modalOpen} onClose={() => setModalOpen(false)} anchorRef={buttonRef} 
        moreStyle={{
          right: "16px",
          top: "48px"
        }}
      >
        <button className="p-2 bg-gray-100 hover:bg-gray-300 rounded-[10px] w-full cursor-pointer"
          onClick={async () => {setModalOpen(false); await signOut({ callbackUrl: "/" });}}
        >
          <div className="flex flex-row items-center justify-center text-gray-800 gap-x-2">
            <LogoutIcon className="w-4 h-4"/>
            <span className="text-[13px]">Log out</span>
          </div>
        </button>
      </Popover>
    </>
  )
}

export default ProfileButton