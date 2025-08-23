import { z } from 'zod'

// Checkout form validation schema
export const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters'),
  customer_email: z.string().email('Please enter a valid email address'),
  customer_phone: z.string().optional(),
  address: z.string().min(10, 'Please enter a complete address'),
  payment_method: z.enum(['Cash on Delivery', 'Bank Transfer'], {
    required_error: 'Please select a payment method'
  }),
  notes: z.string().optional()
})

// Order item validation schema
export const orderItemSchema = z.object({
  product_id: z.number().positive(),
  variant_id: z.number().positive().optional(),
  attributes: z.record(z.string()).optional(),
  quantity: z.number().positive().min(1, 'Quantity must be at least 1'),
  price: z.number().positive()
})

// Product variant validation schema
export const variantSchema = z.object({
  product_id: z.number().positive(),
  sku: z.string().optional(),
  attributes: z.record(z.string()).refine(
    (attrs) => Object.keys(attrs).length > 0,
    'At least one attribute is required'
  ),
  price: z.number().positive().optional(),
  image: z.string().url().optional().or(z.literal('')),
  stock: z.number().min(0, 'Stock cannot be negative'),
  active: z.boolean().default(true)
})

// Search and filter validation
export const searchFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional()
})

// Validate checkout form data
export function validateCheckoutData(data) {
  try {
    return {
      success: true,
      data: checkoutSchema.parse(data),
      errors: null
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: error.errors.reduce((acc, err) => {
        acc[err.path.join('.')] = err.message
        return acc
      }, {})
    }
  }
}

// Validate order items
export function validateOrderItems(items) {
  try {
    const validatedItems = items.map(item => orderItemSchema.parse(item))
    return {
      success: true,
      data: validatedItems,
      errors: null
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: error.errors
    }
  }
}

// Validate product variant
export function validateVariant(variantData) {
  try {
    return {
      success: true,
      data: variantSchema.parse(variantData),
      errors: null
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: error.errors.reduce((acc, err) => {
        acc[err.path.join('.')] = err.message
        return acc
      }, {})
    }
  }
}
