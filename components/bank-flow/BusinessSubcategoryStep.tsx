import { ChevronRight } from "lucide-react";

const BusinessSubcategoryStep = ({
  businessCategories,
  businessSubcategories,
  businessCategory,
  businessSubcategory,
  setBusinessSubcategory,
  setCurrentStep,
}) => {
  const getCategoryColor = (category) => {
    const colors = {
      service: "blue",
      manufacturing: "green",
      trading: "purple",
    };
    return colors[category] || "gray";
  };

  const currentCategory = businessCategories.find(
    (c) => c.value === businessCategory
  );

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center mb-8">
          {currentCategory?.icon}
          <h2 className="text-3xl font-bold text-gray-900 mt-4">
            Select Business Subcategory
          </h2>
          <p className="text-gray-600 mt-2 text-lg">
            Choose your specific business type within {currentCategory?.label}
          </p>
        </div>
        <div
          className={`bg-gradient-to-r ${currentCategory?.bgGradient} ${currentCategory?.borderColor} border rounded-lg p-4 mb-8`}
        >
          <div className="flex items-center justify-center">
            <div className={`text-${getCategoryColor(businessCategory)}-600 mr-4`}>
              {currentCategory?.icon}
            </div>
            <div>
              <h3 className={`text-${getCategoryColor(businessCategory)}-800 font-bold text-lg`}>
                {currentCategory?.label}
              </h3>
              <p className={`text-${getCategoryColor(businessCategory)}-700 text-sm`}>
                {currentCategory?.desc}
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {businessSubcategories[businessCategory]?.map((subcategory) => (
            <button
              key={subcategory.value}
              onClick={() => setBusinessSubcategory(subcategory.value)}
              className={`p-6 rounded-lg border transition-all text-left hover:shadow-md ${
                businessSubcategory === subcategory.value
                  ? `border-${getCategoryColor(businessCategory)}-500 bg-${getCategoryColor(businessCategory)}-50 shadow-md`
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <h4 className="font-semibold text-gray-900 mb-2">{subcategory.value}</h4>
              <p className="text-gray-600 text-sm">{subcategory.desc}</p>
            </button>
          ))}
        </div>
        {businessSubcategory && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p className="text-green-800 font-medium">Business Subcategory Selected</p>
                <p className="text-green-600 text-sm">
                  {businessSubcategory} in {currentCategory?.label}
                </p>
              </div>
              <button
                onClick={() => setCurrentStep(3)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium"
              >
                Continue to Upload
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessSubcategoryStep;