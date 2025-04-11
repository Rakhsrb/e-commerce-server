import Joi from "joi"
import mongoose from "mongoose"

// Size schema validation
const sizeSchema = Joi.object({
  _id: Joi.string().optional(),
  name: Joi.string().required().trim().messages({
    "string.empty": "Size name is required",
    "any.required": "Size name is required",
  }),
  stock: Joi.number().min(0).required().messages({
    "number.base": "Stock must be a number",
    "number.min": "Stock cannot be negative",
    "any.required": "Stock quantity is required",
  }),
  sku: Joi.string().allow("", null).optional(),
})

// Variant schema validation
const variantSchema = Joi.object({
  _id: Joi.string().optional(),
  color: Joi.string().required().trim().messages({
    "string.empty": "Color is required",
    "any.required": "Color is required",
  }),
  colorHex: Joi.string()
    .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .allow("", null)
    .optional()
    .messages({
      "string.pattern.base": "Please provide a valid hex color",
    }),
  sizes: Joi.array().items(sizeSchema).min(1).required().messages({
    "array.min": "At least one size is required",
    "any.required": "Sizes are required",
  }),
  images: Joi.array()
    .items(
      Joi.string()
        .pattern(/^https?:\/\/|^\/images\//)
        .messages({
          "string.pattern.base": "Image must be a valid URL or path",
        }),
    )
    .optional(),
  price: Joi.number().min(0).optional().messages({
    "number.base": "Price must be a number",
    "number.min": "Price cannot be negative",
  }),
  isDefault: Joi.boolean().default(false).optional(),
})

// Weight schema validation
const weightSchema = Joi.object({
  value: Joi.number().min(0).optional(),
  unit: Joi.string().valid("g", "kg", "oz", "lb").default("g").optional(),
})

// Dimensions schema validation
const dimensionsSchema = Joi.object({
  length: Joi.number().min(0).optional(),
  width: Joi.number().min(0).optional(),
  height: Joi.number().min(0).optional(),
  unit: Joi.string().valid("cm", "in").default("cm").optional(),
})

// SEO schema validation
const seoSchema = Joi.object({
  metaTitle: Joi.string().allow("", null).optional(),
  metaDescription: Joi.string().allow("", null).optional(),
  keywords: Joi.array().items(Joi.string()).optional(),
})

// Warranty schema validation
const warrantySchema = Joi.object({
  available: Joi.boolean().default(false).optional(),
  durationMonths: Joi.number().min(0).optional(),
})

// Product schema validation
export const validateProduct = (product, isUpdate = false) => {
  const schema = Joi.object({
    name: isUpdate
      ? Joi.string().trim().max(200).optional().messages({
        "string.max": "Product name cannot exceed 200 characters",
      })
      : Joi.string().required().trim().max(200).messages({
        "string.empty": "Product name is required",
        "string.max": "Product name cannot exceed 200 characters",
        "any.required": "Product name is required",
      }),

    description: isUpdate
      ? Joi.string().trim().optional()
      : Joi.string().required().trim().messages({
        "string.empty": "Product description is required",
        "any.required": "Product description is required",
      }),

    shortDescription: Joi.string().trim().max(300).allow("", null).optional().messages({
      "string.max": "Short description cannot exceed 300 characters",
    }),

    basePrice: isUpdate
      ? Joi.number().min(0).optional().messages({
        "number.base": "Base price must be a number",
        "number.min": "Price cannot be negative",
      })
      : Joi.number().min(0).required().messages({
        "number.base": "Base price must be a number",
        "number.min": "Price cannot be negative",
        "any.required": "Base price is required",
      }),

    discountPercentage: Joi.number().min(0).max(100).default(0).optional().messages({
      "number.base": "Discount percentage must be a number",
      "number.min": "Discount cannot be negative",
      "number.max": "Discount cannot exceed 100%",
    }),

    discountEndDate: Joi.date().iso().allow(null).optional(),

    categories: isUpdate
      ? Joi.array().items(Joi.string()).min(1).optional().messages({
        "array.min": "At least one category is required",
      })
      : Joi.array().items(Joi.string()).min(1).required().messages({
        "array.min": "At least one category is required",
        "any.required": "Categories are required",
      }),

    mainCategory: isUpdate
      ? Joi.string().optional()
      : Joi.string().required().messages({
        "string.empty": "Main category is required",
        "any.required": "Main category is required",
      }),

    tags: Joi.array().items(Joi.string().trim().lowercase()).optional(),

    brand: Joi.string().trim().allow("", null).optional(),

    mainImage: isUpdate
      ? Joi.string()
        .pattern(/^https?:\/\/|^\/images\//)
        .optional()
        .messages({
          "string.pattern.base": "Main image must be a valid URL or path",
        })
      : Joi.string()
        .pattern(/^https?:\/\/|^\/images\//)
        .required()
        .messages({
          "string.pattern.base": "Main image must be a valid URL or path",
          "any.required": "Main product image is required",
        }),

    images: Joi.array()
      .items(
        Joi.string()
          .pattern(/^https?:\/\/|^\/images\//)
          .messages({
            "string.pattern.base": "Image must be a valid URL or path",
          }),
      )
      .optional(),

    variants: Joi.array().items(variantSchema).min(1).optional().messages({
      "array.min": "At least one variant is required",
    }),

    specifications: Joi.object().pattern(Joi.string(), Joi.string()).optional(),

    material: Joi.string().trim().allow("", null).optional(),

    weight: weightSchema.optional(),

    dimensions: dimensionsSchema.optional(),

    stock: Joi.number().min(0).default(0).optional().messages({
      "number.base": "Stock must be a number",
      "number.min": "Stock cannot be negative",
    }),

    sold: Joi.number().min(0).default(0).optional().messages({
      "number.base": "Sold count must be a number",
      "number.min": "Sold count cannot be negative",
    }),

    averageRating: Joi.number().min(0).max(5).default(0).optional().messages({
      "number.base": "Average rating must be a number",
      "number.min": "Average rating cannot be negative",
      "number.max": "Average rating cannot exceed 5",
    }),

    totalReviews: Joi.number().min(0).default(0).optional().messages({
      "number.base": "Total reviews must be a number",
      "number.min": "Total reviews cannot be negative",
    }),

    seo: seoSchema.optional(),

    warranty: warrantySchema.optional(),

    barcode: Joi.string().trim().allow("", null).optional(),
  })

  return schema.validate(product, { abortEarly: false, stripUnknown: true })
}

// Stock update validation
export const validateStockUpdate = (data) => {
  const schema = Joi.object({
    colorId: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid")
        }
        return value
      })
      .messages({
        "string.empty": "Color ID is required",
        "any.required": "Color ID is required",
        "any.invalid": "Invalid color ID format",
      }),

    sizeId: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid")
        }
        return value
      })
      .messages({
        "string.empty": "Size ID is required",
        "any.required": "Size ID is required",
        "any.invalid": "Invalid size ID format",
      }),

    quantity: Joi.number().integer().min(1).required().messages({
      "number.base": "Quantity must be a number",
      "number.integer": "Quantity must be an integer",
      "number.min": "Quantity must be at least 1",
      "any.required": "Quantity is required",
    }),
  })

  return schema.validate(data, { abortEarly: false })
}
