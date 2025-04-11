import ASU_MESSAGES from "../messages/messages.js"
import createUser from "../middlewares/userCreater.js"

/**
 * Создать нового администратора
 */
export const CreateNewAdmin = async (req, res) => {
    try {
        const result = await createUser(req.body, "admin", ASU_MESSAGES.ADMIN_CREATED)
        return res.status(201).json(result)
    } catch (error) {
        console.error("CreateNewAdmin error:", error)
        return res.status(error.status || 500).json({
            message: error.message || ASU_MESSAGES.INTERNAL_ERROR,
        })
    }
}