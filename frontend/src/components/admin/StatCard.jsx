
const StatCard = ({ title, value, change, isPositive }) => {
  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-sm text-gray-600 mb-2">{title}</h3>
      <p className="text-3xl font-bold mb-2">{value}</p>
      <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? '↑' : '↓'} {change}
      </p>
    </div>
  );
};
export default StatCard;