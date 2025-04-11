import jwt from "jsonwebtoken";

export default function (obj) {
  return jwt.sign(obj, process.env.JWTSECRET_KEY, { expiresIn: "7d" });
}
