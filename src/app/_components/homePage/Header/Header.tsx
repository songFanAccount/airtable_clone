import LogoCorner from "./LogoCorner";
import SearchBar from "./SearchBar";
import InfoCorner from "./InfoCorner";

const Header = () => {
  return (
    <div className="flex flex-col overflow-visible h-[56px] min-h-[56px] border-b-[1px] box-border w-full bg-white">
      <div 
        className="flex justify-between items-center h-[56px] min-h-[56px] border-b-[1px] box-border w-full bg-white pl-[8px] pr-[16px]"
        style={{
          boxShadow: '0px 0px 1px rgba(0, 0, 0, 0.32), 0px 0px 2px rgba(0, 0, 0, 0.08), 0px 1px 3px rgba(0, 0, 0, 0.08)', 
          borderColor: "hsl(202, 10%, 88%)" 
        }}
      >
        <LogoCorner />
        <SearchBar />
        <InfoCorner />
      </div>
      <div className="min-h-[20px]"/>
    </div>
  );
};

export default Header;