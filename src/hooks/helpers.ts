import {useEffect, useState} from "react";

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