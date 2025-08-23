import React, { useState, useEffect } from 'react'

export default function VariantSelector({ 
  attributeMatrix, 
  selectedAttributes, 
  onAttributeChange, 
  availableVariants 
}) {
  const [validCombinations, setValidCombinations] = useState(new Set())

  // Build set of valid attribute combinations
  useEffect(() => {
    const combinations = new Set()
    availableVariants.forEach(variant => {
      if (variant.active && variant.stock > 0) {
        combinations.add(JSON.stringify(variant.attributes))
      }
    })
    setValidCombinations(combinations)
  }, [availableVariants])

  // Check if a specific value is selectable for a given attribute
  const isValueSelectable = (attributeKey, value) => {
    const testAttributes = { ...selectedAttributes, [attributeKey]: value }
    
    // Check if this combination leads to any valid variant
    return availableVariants.some(variant => {
      if (!variant.active || variant.stock <= 0) return false
      
      // Check if the test attributes are compatible with this variant
      return Object.keys(testAttributes).every(key => 
        variant.attributes[key] === testAttributes[key]
      )
    })
  }

  // Get available values for an attribute based on current selection
  const getAvailableValues = (attributeKey) => {
    const allValues = attributeMatrix[attributeKey] || []
    
    if (Object.keys(selectedAttributes).length === 0) {
      // No attributes selected yet, show all values that have stock
      return allValues.filter(value => isValueSelectable(attributeKey, value))
    }

    // Filter values based on current selection
    return allValues.filter(value => {
      const testAttributes = { ...selectedAttributes, [attributeKey]: value }
      
      return availableVariants.some(variant => {
        if (!variant.active || variant.stock <= 0) return false
        
        // Check if all selected attributes match this variant
        return Object.keys(testAttributes).every(key => 
          variant.attributes[key] === testAttributes[key]
        )
      })
    })
  }

  if (!attributeMatrix || Object.keys(attributeMatrix).length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {Object.entries(attributeMatrix).map(([attributeKey, allValues]) => {
        const availableValues = getAvailableValues(attributeKey)
        
        return (
          <div key={attributeKey} className="space-y-3">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900">{attributeKey}:</h3>
              {selectedAttributes[attributeKey] && (
                <span className="text-sm text-purple-600 font-medium">
                  {selectedAttributes[attributeKey]}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {allValues.map((value) => {
                const isSelected = selectedAttributes[attributeKey] === value
                const isAvailable = availableValues.includes(value)
                
                return (
                  <button
                    key={value}
                    onClick={() => {
                      if (isAvailable) {
                        onAttributeChange(attributeKey, value)
                      }
                    }}
                    disabled={!isAvailable}
                    className={`
                      px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                      ${isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : isAvailable
                        ? 'bg-white text-gray-700 border-gray-300 hover:border-purple-300 hover:text-purple-600'
                        : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                      }
                    `}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
            
            {availableValues.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                No available options for current selection
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
