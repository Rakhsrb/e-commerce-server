import ASU_MESSAGES from "../messages/messages.js"
import User from "../models/user.js"

/**
 * Авторизация пользователя
 */
export const Login = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body

        // Проверка наличия обязательных полей
        if (!phoneNumber || !password) {
            return res.status(400).json({
                message: "Номер телефона и пароль обязательны.",
            })
        }

        // Поиск пользователя
        const user = await User.findOne({ phoneNumber })
        if (!user) {
            return res.status(401).json({ message: ASU_MESSAGES.PHONE_NOT_EXISTS })
        }

        // Проверка пароля
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: ASU_MESSAGES.INVALID_CREDENTIALS })
        }

        // Генерация токена
        const token = generateToken({ userId: user._id, role: user.role })

        // Исключаем пароль из ответа
        const userResponse = user.toObject()
        delete userResponse.password

        return res.status(200).json({
            message: ASU_MESSAGES.LOGIN_SUCCESS,
            data: userResponse,
            token,
        })
    } catch (error) {
        console.error("Login error:", error)
        return res.status(500).json({ message: ASU_MESSAGES.INTERNAL_ERROR })
    }
}