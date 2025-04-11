import User from "../models/user.js"
import ASU_MESSAGES from "../messages/messages.js"
import bcrypt from "bcrypt"
import generateAvatar from "../middlewares/generateAvatar.js"

/**
 * Получить всех пользователей по роли
 */
export const GetUsersByRole = async (req, res) => {
    try {
        const { role } = req.query

        if (!role) {
            return res.status(400).json({ message: "Роль обязательна." })
        }

        const users = await User.find({ role }).select("-password")
        return res.status(200).json({ data: users })
    } catch (error) {
        console.error("GetAllRequestedUsers error:", error)
        return res.status(500).json({ message: ASU_MESSAGES.INTERNAL_ERROR })
    }
}

/**
 * Поиск пользователей по номеру телефона
 */
export const GetUsersByPhoneNumber = async (req, res) => {
    try {
        const { phoneNumber } = req.query

        if (!phoneNumber) {
            return res.status(400).json({ message: ASU_MESSAGES.PHONE_REQUIRED })
        }

        const phoneNumberRegExp = new RegExp(phoneNumber, "i")
        const users = await User.find({ phoneNumber: phoneNumberRegExp }).select("-password")

        if (!users || users.length === 0) {
            return res.status(404).json({ message: ASU_MESSAGES.USER_NOT_FOUND })
        }

        return res.status(200).json({ data: users })
    } catch (error) {
        console.error("GetUsersByPhoneNumber error:", error)
        return res.status(500).json({ message: ASU_MESSAGES.INTERNAL_ERROR })
    }
}

/**
 * Получить одного пользователя по ID
 */
export const GetOneUserById = async (req, res) => {
    try {
        const { id } = req.params

        if (!id) {
            return res.status(400).json({ message: "ID пользователя обязателен." })
        }

        const user = await User.findById(id).select("-password")

        if (!user) {
            return res.status(404).json({ message: ASU_MESSAGES.USER_NOT_FOUND })
        }

        return res.status(200).json({ data: user })
    } catch (error) {
        console.error("GetOneUserById error:", error)
        return res.status(500).json({ message: ASU_MESSAGES.INTERNAL_ERROR })
    }
}

/**
 * Обновить пользователя
 */
export const UpdateUser = async (req, res) => {
    try {
        const { id } = req.params
        const { phoneNumber, firstName, lastName, password, role } = req.body

        // Проверка существования пользователя
        const existingUser = await User.findById(id)
        if (!existingUser) {
            return res.status(404).json({ message: ASU_MESSAGES.USER_NOT_FOUND })
        }

        // Подготовка данных для обновления
        const updateData = {
            phoneNumber,
            firstName,
            lastName,
            role,
            avatar: generateAvatar(firstName, lastName),
        }

        // Обновление пароля только если он предоставлен
        if (password) {
            updateData.password = await bcrypt.hash(password, 10)
        }

        // Обновление пользователя
        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select(
            "-password",
        )

        return res.status(200).json({ data: updatedUser })
    } catch (error) {
        console.error("UpdateUser error:", error)
        return res.status(500).json({ message: ASU_MESSAGES.INTERNAL_ERROR })
    }
}

/**
 * Удалить пользователя
 */
export const DeleteUser = async (req, res) => {
    try {
        const { id } = req.params

        if (!id) {
            return res.status(400).json({ message: "ID пользователя обязателен." })
        }

        const deletedUser = await User.findByIdAndDelete(id)

        if (!deletedUser) {
            return res.status(404).json({ message: ASU_MESSAGES.USER_NOT_FOUND })
        }

        return res.status(200).json({ message: ASU_MESSAGES.USER_DELETED })
    } catch (error) {
        console.error("DeleteUser error:", error)
        return res.status(500).json({ message: ASU_MESSAGES.INTERNAL_ERROR })
    }
}

/**
 * Получить информацию о текущем пользователе
 */
export const Profile = async (req, res) => {
    try {
        if (!req.userInfo || !req.userInfo.userId) {
            return res.status(401).json({ message: "Не авторизован." })
        }

        const user = await User.findById(req.userInfo.userId).select("-password")

        if (!user) {
            return res.status(404).json({ message: ASU_MESSAGES.USER_NOT_FOUND })
        }

        return res.status(200).json({ data: user })
    } catch (error) {
        console.error("Profile error:", error)
        return res.status(500).json({ message: ASU_MESSAGES.INTERNAL_ERROR })
    }
}
