import ASU_MESSAGES from "../messages/messages.js"
import createUser from "../middlewares/userCreater.js"

/**
 * Создать нового клиента
 */
export const CreateNewClient = async (req, res) => {
  try {
    const result = await createUser(req.body, "client", ASU_MESSAGES.CLIENT_CREATED)
    return res.status(201).json(result)
  } catch (error) {
    console.error("CreateNewClient error:", error)
    return res.status(error.status || 500).json({
      message: error.message || ASU_MESSAGES.INTERNAL_ERROR,
    })
  }
}