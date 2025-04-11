import jwt from "jsonwebtoken";

export default function (req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace(/Bearer\s?/, "");
    if (!token) {
      return res
        .status(403)
        .json({ message: "Доступ запрещен: токен отсутствует" });
    }

    const { userId, role } = jwt.verify(token, process.env.JWTSECRET_KEY);
    req.userInfo = { userId, role };
    next();
  } catch (error) {
    console.error("Ошибка верификации токена:", error.message);
    return res
      .status(403)
      .json({ message: "Доступ запрещен: некорректный токен" });
  }
}