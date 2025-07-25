import {useEffect, useState} from "react";
import { toast } from "react-toastify";

export const useSmallerThan600 = () => {
  const [isSmaller, setIsSmaller] = useState(false)
  useEffect(() => {
    const query = window.matchMedia("(max-width: 599px)")
    const update = () => setIsSmaller(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  return isSmaller
}

export const toastNoUI = () => toast("No UI on purpose, lmk if you want this implemented!")
export const toastNoFunction = () => toast("Not functional on purpose, lmk if you want this implemented!")
export const toastTODO = (feature: string) => toast(`TODO: ${feature}`)
export const toastNoWay = () => toast("ain't no way im making this bruh")