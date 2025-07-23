import LogoCorner from "./LogoCorner";
import SearchBar from "./SearchBar";
import InfoCorner from "./InfoCorner";

const Header = () => {
  return <div className="flex justify-between items-center h-[56px] min-h-[56px] border-b w-full bg-white pl-[8px] pr-[16px] overflow-hidden" style={{ borderColor: "hsl(202, 10%, 88%)" }}>
    <LogoCorner />
    <SearchBar />
    <InfoCorner />
  </div>;
};

export default Header;