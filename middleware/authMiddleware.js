import jwt from "jsonwebtoken";

export default (req, res, next) => {
  if (req.method === "OPTIONS") {
    next();
  }
  try {
    const token = req.headers.authorization && req.headers.authorization;

    if (!token) {
      return res.status(403).json({ message: "Пользователь не авторизован" });
    }
    const decodedData = jwt.verify(token, "secret1234");
    req.userId = decodedData._id;
    next();
  } catch (e) {
    console.log(e);
    res.status(403).json({ message: "Не удалось авторизваться" });
  }
};
