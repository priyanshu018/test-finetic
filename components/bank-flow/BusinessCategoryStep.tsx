import { Building2, ChevronRight } from "lucide-react";

const BusinessCategoryStep = ({
  businessCategories,
  businessCategory,
  setBusinessCategory,
  setCurrentStep,
}) => {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center mb-8">
          <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">Select Business Category</h2>
          <p className="text-gray-600 mt-2 text-lg">
            Choose your primary business category for accurate classification
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {businessCategories.map((category) => (
            <button
              key={category.value}
              onClick={() => setBusinessCategory(category.value)}
              className={`p-8 rounded-xl border-2 transition-all text-left hover:shadow-lg group ${
                businessCategory === category.value
                  ? `border-${category.color}-500 bg-gradient-to-br ${category.bgGradient} shadow-lg`
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className={`text-${category.color}-600 mb-4 group-hover:scale-110 transition-transform`}
              >
                {category.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{category.label}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{category.desc}</p>
            </button>
          ))}
        </div>
        {businessCategory && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p className="text-green-800 font-medium">Business Category Selected</p>
                <p className="text-green-600 text-sm">
                  {businessCategories.find((c) => c.value === businessCategory)?.label}
                </p>
              </div>
              <button
                onClick={() => setCurrentStep(2)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium"
              >
                Continue to Subcategory
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessCategoryStep;