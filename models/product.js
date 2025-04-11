import mongoose from "mongoose"
import slugify from "mongoose-slug-generator"

// Initialize slug plugin
mongoose.plugin(slugify)

/**
 * Size schema - represents product size with inventory tracking
 */
const SizeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Size name is required"],
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
  },
  { _id: true },
)

/**
 * Variant schema - represents product variations (color/size combinations)
 */
const VariantSchema = new mongoose.Schema(
  {
    color: {
      type: String,
      required: [true, "Color is required"],
      trim: true,
    },
    colorHex: {
      type: String,
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Please provide a valid hex color"],
    },
    sizes: [SizeSchema],
    images: [
      {
        type: String,
        validate: {
          validator: (v) => /^https?:\/\//.test(v) || /^\/images\//.test(v),
          message: (props) => `${props.value} is not a valid image URL!`,
        },
      },
    ],
    price: {
      type: Number,
      min: [0, "Price cannot be negative"],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true },
)

/**
 * Product schema - main product model for e-commerce
 */
const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, "Short description cannot exceed 300 characters"],
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
    },
    discountEndDate: {
      type: Date,
    },
    categories: [
      {
        type: String,
        required: true,
        index: true,
      },
    ],
    mainCategory: {
      type: String,
      required: [true, "Main category is required"],
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    brand: {
      type: String,
      trim: true,
      index: true,
    },
    mainImage: {
      type: String,
      required: [true, "Main product image is required"],
    },
    images: [
      {
        type: String,
        validate: {
          validator: (v) => /^https?:\/\//.test(v) || /^\/images\//.test(v),
          message: (props) => `${props.value} is not a valid image URL!`,
        },
      },
    ],
    variants: [VariantSchema],
    specifications: {
      type: Map,
      of: String,
    },
    material: {
      type: String,
      trim: true,
    },
    weight: {
      value: { type: Number, min: 0 },
      unit: { type: String, enum: ["g", "kg", "oz", "lb"], default: "g" },
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: { type: String, enum: ["cm", "in"], default: "cm" },
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
      index: true,
    },
    sold: {
      type: Number,
      default: 0,
      min: [0, "Sold count cannot be negative"],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    seo: {
      metaTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      keywords: [{ type: String, trim: true }],
    },
    warranty: {
      available: { type: Boolean, default: false },
      durationMonths: { type: Number, min: 0 },
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  },
)

ProductSchema.index({ name: "text", description: "text", })
ProductSchema.index({ createdAt: -1 })
ProductSchema.index({ updatedAt: -1 })
ProductSchema.index({ basePrice: 1 })
ProductSchema.index({ discountPercentage: 1 })
ProductSchema.index({ "variants.color": 1 })

// Virtual for current price calculation
ProductSchema.virtual("currentPrice").get(function () {
  if (!this.discountPercentage || this.discountPercentage === 0) {
    return this.basePrice
  }

  // Check if discount is still valid
  if (this.discountEndDate && new Date() > this.discountEndDate) {
    return this.basePrice
  }

  return Number.parseFloat((this.basePrice * (1 - this.discountPercentage / 100)).toFixed(2))
})

// Virtual for stock status
ProductSchema.virtual("stockStatus").get(function () {
  if (this.stock <= 0) return "out_of_stock"
  if (this.stock <= this.lowStockThreshold) return "low_stock"
  return "in_stock"
})

// Virtual for related products (to be populated)
ProductSchema.virtual("relatedProducts", {
  ref: "Product",
  localField: "mainCategory",
  foreignField: "mainCategory",
  justOne: false,
  options: { limit: 5 },
})

// Pre-save hook to update total stock based on variants
ProductSchema.pre("save", function (next) {
  // Calculate total stock from variants if they exist
  if (this.variants && this.variants.length > 0) {
    let totalStock = 0

    this.variants.forEach((variant) => {
      if (variant.sizes && variant.sizes.length > 0) {
        variant.sizes.forEach((size) => {
          totalStock += size.stock
        })
      }
    })

    this.stock = totalStock
  }

  // Calculate average rating
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0)
    this.averageRating = Number.parseFloat((totalRating / this.reviews.length).toFixed(1))
    this.totalReviews = this.reviews.length
  }

  // Set status to out_of_stock if stock is 0
  if (this.stock <= 0) {
    this.status = "out_of_stock"
  }

  next()
})

// Method to check if product is on sale
ProductSchema.methods.isOnSale = function () {
  if (!this.discountPercentage || this.discountPercentage === 0) {
    return false
  }

  if (this.discountEndDate && new Date() > this.discountEndDate) {
    return false
  }

  return true
}

// Method to check if specific variant/size is in stock
ProductSchema.methods.checkVariantStock = function (colorId, sizeId) {
  const variant = this.variants.id(colorId)
  if (!variant) return 0

  const size = variant.sizes.id(sizeId)
  if (!size) return 0

  return size.stock
}

// Method to update stock
ProductSchema.methods.updateStock = function (colorId, sizeId, quantity) {
  const variant = this.variants.id(colorId)
  if (!variant) return false

  const size = variant.sizes.id(sizeId)
  if (!size) return false

  if (size.stock < quantity) return false

  size.stock -= quantity
  this.sold += quantity

  return true
}

// Static method to find products on sale
ProductSchema.statics.findOnSale = function (limit = 10) {
  return this.find({
    discountPercentage: { $gt: 0 },
    status: "active",
    $or: [{ discountEndDate: { $exists: false } }, { discountEndDate: { $gt: new Date() } }],
  })
    .sort({ discountPercentage: -1 })
    .limit(limit)
}

// Static method to search products
ProductSchema.statics.searchProducts = function (query, options = {}) {
  const { categories, priceMin, priceMax, sort = "relevance", page = 1, limit = 20 } = options

  const searchQuery = {
    status: "active",
    $text: { $search: query },
  }

  if (categories && categories.length > 0) {
    searchQuery.mainCategory = { $in: categories }
  }

  if (priceMin !== undefined || priceMax !== undefined) {
    searchQuery.basePrice = {}
    if (priceMin !== undefined) searchQuery.basePrice.$gte = priceMin
    if (priceMax !== undefined) searchQuery.basePrice.$lte = priceMax
  }

  let sortOptions = {}
  switch (sort) {
    case "price_asc":
      sortOptions = { basePrice: 1 }
      break
    case "price_desc":
      sortOptions = { basePrice: -1 }
      break
    case "newest":
      sortOptions = { createdAt: -1 }
      break
    case "bestselling":
      sortOptions = { sold: -1 }
      break
    case "rating":
      sortOptions = { averageRating: -1 }
      break
    default:
      sortOptions = { score: { $meta: "textScore" } }
  }

  return this.find(searchQuery)
    .select("name slug mainImage basePrice discountPercentage averageRating totalReviews stock")
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(limit)
}

export default mongoose.model("Product", ProductSchema)
