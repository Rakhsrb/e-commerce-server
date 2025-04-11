import Product from "../models/product.js"
import mongoose from "mongoose"
import { validateProduct, validateStockUpdate } from "../validators/productValidator.js"

/**
 * Get all products with pagination, filtering, and sorting
 */
export const getAllProducts = async (req, res) => {
    try {
        const {
            search,
            category,
            brand,
            minPrice,
            maxPrice,
            sort = "newest",
            page = 1,
            limit = 10,
            inStock,
            onSale
        } = req.query

        const queryObject = {}

        // Text search
        if (search) {
            queryObject.$text = { $search: search }
        }

        // Category filter
        if (category) {
            if (Array.isArray(category)) {
                queryObject.categories = { $in: category }
            } else {
                queryObject.categories = category
            }
        }

        // Brand filter
        if (brand) {
            if (Array.isArray(brand)) {
                queryObject.brand = { $in: brand }
            } else {
                queryObject.brand = brand
            }
        }

        // Price filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            queryObject.basePrice = {}
            if (minPrice !== undefined) queryObject.basePrice.$gte = Number(minPrice)
            if (maxPrice !== undefined) queryObject.basePrice.$lte = Number(maxPrice)
        }

        // Stock filter
        if (inStock === "true") {
            queryObject.stock = { $gt: 0 }
        }

        // Sale filter
        if (onSale === "true") {
            queryObject.discountPercentage = { $gt: 0 }
            queryObject.$or = [
                { discountEndDate: { $exists: false } },
                { discountEndDate: { $gt: new Date() } }
            ]
        }

        // Sorting
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
            case "relevance":
                sortOptions = search ? { score: { $meta: "textScore" } } : { createdAt: -1 }
                break
            default:
                sortOptions = { createdAt: -1 }
        }

        const pageNum = parseInt(page) || 1
        const limitNum = parseInt(limit) || 10
        const skip = (pageNum - 1) * limitNum

        // Select fields to return (optimization)
        const projection = "name description basePrice discountPercentage mainImage stock averageRating totalReviews variants"

        // Execute query with pagination
        const products = await Product.find(queryObject)
            .select(projection)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean()

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(queryObject)
        const numOfPages = Math.ceil(totalProducts / limitNum)

        // Get available filters for refinement
        const availableBrands = await Product.distinct("brand", queryObject)
        const availableCategories = await Product.distinct("categories", queryObject)
        const priceRange = await Product.aggregate([
            { $match: queryObject },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: "$basePrice" },
                    maxPrice: { $max: "$basePrice" }
                }
            }
        ])

        // Calculate current price with discount for each product
        const productsWithCurrentPrice = products.map(product => {
            const currentPrice = product.discountPercentage > 0 ?
                Number((product.basePrice * (1 - product.discountPercentage / 100)).toFixed(2)) :
                product.basePrice

            return {
                ...product,
                currentPrice
            }
        })

        res.json({
            products: productsWithCurrentPrice,
            totalProducts,
            numOfPages,
            currentPage: pageNum,
            filters: {
                brands: availableBrands,
                categories: availableCategories,
                priceRange: priceRange.length > 0 ? priceRange[0] : { minPrice: 0, maxPrice: 0 }
            }
        })
    } catch (error) {
        console.error("Error in getAllProducts:", error)
        res.status(500).json({ error: "Failed to fetch products" })
    }
}

/**
 * Get discounted products
 */
export const getDiscountedProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query
        const limitNum = parseInt(limit) || 10

        const products = await Product.findOnSale(limitNum)

        // Calculate current price with discount for each product
        const productsWithCurrentPrice = products.map(product => {
            const currentPrice = Number((product.basePrice * (1 - product.discountPercentage / 100)).toFixed(2))
            return {
                ...product.toObject(),
                currentPrice
            }
        })

        res.json({ products: productsWithCurrentPrice })
    } catch (error) {
        console.error("Error in getDiscountedProducts:", error)
        res.status(500).json({ error: "Failed to fetch discounted products" })
    }
}

/**
 * Get single product by ID
 */
export const getProductById = async (req, res) => {
    try {
        const { id: productId } = req.params

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: "Invalid product ID format" })
        }

        const product = await Product.findById(productId)
            .populate("relatedProducts", "name mainImage basePrice discountPercentage averageRating")

        if (!product) {
            return res.status(404).json({ error: `Product with id ${productId} not found` })
        }

        // Calculate current price
        const productObj = product.toObject()
        productObj.currentPrice = product.isOnSale() ?
            Number((product.basePrice * (1 - product.discountPercentage / 100)).toFixed(2)) :
            product.basePrice

        res.json({ product: productObj })
    } catch (error) {
        console.error("Error in getProductById:", error)
        res.status(500).json({ error: "Failed to fetch product" })
    }
}

/**
 * Create new product
 */
export const createProduct = async (req, res) => {
    try {
        // Validate input
        const { error, value } = validateProduct(req.body)

        if (error) {
            return res.status(400).json({ error: error.details[0].message })
        }

        // Create product with validated data
        const product = await Product.create(value)

        res.status(201).json({
            message: "Product created successfully",
            product
        })
    } catch (error) {
        console.error("Error in createProduct:", error)

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ error: "A product with this name already exists" })
        }

        // Handle validation errors
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map(val => val.message)
            return res.status(400).json({ error: messages.join(', ') })
        }

        res.status(500).json({ error: "Failed to create product" })
    }
}

/**
 * Update product
 */
export const updateProduct = async (req, res) => {
    try {
        const { id: productId } = req.params

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: "Invalid product ID format" })
        }

        // Validate input
        const { error, value } = validateProduct(req.body, true)

        if (error) {
            return res.status(400).json({ error: error.details[0].message })
        }

        const product = await Product.findOneAndUpdate(
            { _id: productId },
            value,
            { new: true, runValidators: true }
        )

        if (!product) {
            return res.status(404).json({ error: `Product with id ${productId} not found` })
        }

        res.json({
            message: "Product updated successfully",
            product
        })
    } catch (error) {
        console.error("Error in updateProduct:", error)

        // Handle validation errors
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map(val => val.message)
            return res.status(400).json({ error: messages.join(', ') })
        }

        res.status(500).json({ error: "Failed to update product" })
    }
}

/**
 * Delete product
 */
export const deleteProduct = async (req, res) => {
    try {
        const { id: productId } = req.params

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: "Invalid product ID format" })
        }

        const product = await Product.findById(productId)

        if (!product) {
            return res.status(404).json({ error: `Product with id ${productId} not found` })
        }

        await product.remove()

        res.json({
            message: "Product successfully removed",
            productId
        })
    } catch (error) {
        console.error("Error in deleteProduct:", error)
        res.status(500).json({ error: "Failed to delete product" })
    }
}

/**
 * Update product stock
 */
export const updateProductStock = async (req, res) => {
    try {
        const { id: productId } = req.params

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: "Invalid product ID format" })
        }

        // Validate input
        const { error, value } = validateStockUpdate(req.body)

        if (error) {
            return res.status(400).json({ error: error.details[0].message })
        }

        const { colorId, sizeId, quantity } = value

        const product = await Product.findById(productId)

        if (!product) {
            return res.status(404).json({ error: `Product with id ${productId} not found` })
        }

        const updated = product.updateStock(colorId, sizeId, Number(quantity))

        if (!updated) {
            return res.status(400).json({
                error: "Unable to update stock. Check variant/size IDs or available quantity"
            })
        }

        await product.save()

        res.json({
            message: "Stock updated successfully",
            product
        })
    } catch (error) {
        console.error("Error in updateProductStock:", error)
        res.status(500).json({ error: "Failed to update product stock" })
    }
}

/**
 * Get related products
 */
export const getRelatedProducts = async (req, res) => {
    try {
        const { id: productId } = req.params
        const { limit = 5 } = req.query

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ error: "Invalid product ID format" })
        }

        const product = await Product.findById(productId)

        if (!product) {
            return res.status(404).json({ error: `Product with id ${productId} not found` })
        }

        const relatedProducts = await Product.find({
            _id: { $ne: productId },
            mainCategory: product.mainCategory
        })
            .select("name mainImage basePrice discountPercentage averageRating totalReviews")
            .limit(Number(limit))
            .lean()

        // Calculate current price for each related product
        const relatedWithCurrentPrice = relatedProducts.map(product => {
            const currentPrice = product.discountPercentage > 0 ?
                Number((product.basePrice * (1 - product.discountPercentage / 100)).toFixed(2)) :
                product.basePrice

            return {
                ...product,
                currentPrice
            }
        })

        res.json({ relatedProducts: relatedWithCurrentPrice })
    } catch (error) {
        console.error("Error in getRelatedProducts:", error)
        res.status(500).json({ error: "Failed to fetch related products" })
    }
}

/**
 * Search products
 */
export const searchProducts = async (req, res) => {
    try {
        const { query, categories, priceMin, priceMax, sort, page = 1, limit = 20 } = req.query

        if (!query) {
            return res.status(400).json({ error: "Please provide a search query" })
        }

        const options = {
            categories: categories ? (Array.isArray(categories) ? categories : categories.split(",")) : undefined,
            priceMin: priceMin ? Number(priceMin) : undefined,
            priceMax: priceMax ? Number(priceMax) : undefined,
            sort,
            page: Number(page),
            limit: Number(limit)
        }

        const products = await Product.searchProducts(query, options)

        // Calculate current price for each product
        const productsWithCurrentPrice = products.map(product => {
            const currentPrice = product.discountPercentage > 0 ?
                Number((product.basePrice * (1 - product.discountPercentage / 100)).toFixed(2)) :
                product.basePrice

            return {
                ...product.toObject(),
                currentPrice
            }
        })

        // Get total count for pagination
        const totalCount = await Product.countDocuments({
            $text: { $search: query },
            ...(options.categories ? { categories: { $in: options.categories } } : {}),
            ...(options.priceMin !== undefined || options.priceMax !== undefined ? {
                basePrice: {
                    ...(options.priceMin !== undefined ? { $gte: options.priceMin } : {}),
                    ...(options.priceMax !== undefined ? { $lte: options.priceMax } : {})
                }
            } : {})
        })

        res.json({
            products: productsWithCurrentPrice,
            totalProducts: totalCount,
            numOfPages: Math.ceil(totalCount / options.limit),
            currentPage: options.page
        })
    } catch (error) {
        console.error("Error in searchProducts:", error)
        res.status(500).json({ error: "Failed to search products" })
    }
}

/**
 * Get product categories
 */
export const getProductCategories = async (req, res) => {
    try {
        const categories = await Product.distinct("categories")
        res.json({ categories })
    } catch (error) {
        console.error("Error in getProductCategories:", error)
        res.status(500).json({ error: "Failed to fetch product categories" })
    }
}

/**
 * Get product brands
 */
export const getProductBrands = async (req, res) => {
    try {
        const brands = await Product.distinct("brand")
        res.json({ brands })
    } catch (error) {
        console.error("Error in getProductBrands:", error)
        res.status(500).json({ error: "Failed to fetch product brands" })
    }
}