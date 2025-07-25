import { toastNoUI } from "~/hooks/helpers"

const ProfileButton = () => {
  return (
    <button className="flex justify-center items-center w-[26px] h-[26px] rounded-full bg-[#ffba05] cursor-pointer"
      onClick={toastNoUI}
    >
      <div className="text-[13px] pt-0.5">
        D
      </div>
    </button>
  )
}

export default ProfileButton