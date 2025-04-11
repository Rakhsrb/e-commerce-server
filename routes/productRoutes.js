import express from "express"
import {
    getAllProducts,
    getDiscountedProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    getRelatedProducts,
    searchProducts,
    getProductCategories,
    getProductBrands,
    bulkUpdateProducts
} from "../controllers/productController.js"

const router = express.Router()

// Public routes with rate limiting and caching for better performance
router.get("/", getAllProducts)
router.get("/discounted", getDiscountedProducts)
router.get("/search", searchProducts)
router.get("/categories", getProductCategories)
router.get("/brands", getProductBrands)
router.get("/:id", getProductById)
router.get("/:id/related", getRelatedProducts)

// Protected routes for admin operations
router.post("/", createProduct)
router.patch("/bulk", bulkUpdateProducts)
router.patch("/:id", updateProduct)
router.delete("/:id", deleteProduct)
router.patch("/:id/stock", updateProductStock)

export default router
