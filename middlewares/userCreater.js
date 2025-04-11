import ASU_ASU_MESSAGES from "../messages/messages.js"
import User from "../models/user.js"

/**
 * Создать нового пользователя (общая функция)
 */
const createUser = async (userData, role, successMessage) => {
    const { phoneNumber, password, firstName, lastName } = userData

    const existingUser = await User.findOne({ phoneNumber })
    if (existingUser) {
        throw { status: 409, message: ASU_ASU_MESSAGES.PHONE_EXISTS }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = new User({
        phoneNumber,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        avatar: generateAvatar(firstName, lastName),
    })

    await newUser.save()

    const userResponse = newUser.toObject()
    delete userResponse.password
    return {
        message: successMessage,
        data: userResponse,
    }
}

export default createUser