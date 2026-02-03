const Header = () => {
  return (
    <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative flex-1 max-w-md">
          <input 
            type="text" 
            placeholder="Search Now" 
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
      </div>
      <button className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
        <User className="w-5 h-5 text-purple-600" />
      </button>
    </div>
  );
};

export default Header;