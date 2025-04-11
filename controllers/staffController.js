import ASU_MESSAGES from "../messages/messages.js"
import createUser from "../middlewares/userCreater.js"

/**
 * Создать нового сотрудника
 */
export const CreateNewStaff = async (req, res) => {
    try {
        const result = await createUser(req.body, "staff", ASU_MESSAGES.STAFF_CREATED)
        return res.status(201).json(result)
    } catch (error) {
        console.error("CreateNewStaff error:", error)
        return res.status(error.status || 500).json({
            message: error.message || ASU_MESSAGES.INTERNAL_ERROR,
        })
    }
}
