import jwt from "jsonwebtoken";

export default (req, res, next) => {
  // Simply pass through all requests without authentication
  console.log("Authentication middleware bypassed");
  req.userId = "bypassed-auth"; // Set a default user ID
  return next();
  
  // Original code commented out below
  /*
  if (req.method === "OPTIONS") {
    return next();
  }
  
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(403).json({ message: "Пользователь не авторизован" });
    }
    
    // Проверка на null или undefined
    if (token === 'null' || token === 'undefined') {
      return res.status(403).json({ message: "Некорректный токен авторизации" });
    }
    
    const decodedData = jwt.verify(token, "secret1234");
    req.userId = decodedData._id;
    return next();
  } catch (e) {
    console.log("Ошибка авторизации:", e);
    return res.status(403).json({ message: "Не удалось авторизоваться", error: e.message });
  }
  */
};
