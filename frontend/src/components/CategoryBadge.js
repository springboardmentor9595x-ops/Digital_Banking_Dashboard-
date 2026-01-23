function CategoryBadge({ category }) { 
  const colors = {
    Income: "bg-green-100 text-green-700",
    Food: "bg-orange-100 text-orange-700",
    Groceries: "bg-green-100 text-green-700",
    Transport: "bg-blue-100 text-blue-700",
    Shopping: "bg-pink-100 text-pink-700",
    Bills: "bg-yellow-100 text-yellow-700",
    Entertainment: "bg-purple-100 text-purple-700",
    Health: "bg-red-100 text-red-700",
    Education: "bg-indigo-100 text-indigo-700",
    Others: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        colors[category] || colors.Others
      }`}
    >
      {category || "Others"}
    </span>
  );
}

export default CategoryBadge;
