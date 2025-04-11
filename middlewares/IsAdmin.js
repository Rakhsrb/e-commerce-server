export default function (req, res, next) {
  const { role } = req.userInfo;
  if (!role && role !== "admin") return res.status(403).json({ message: "Доступ запрещен: некорректный токен" });
  next();
}
