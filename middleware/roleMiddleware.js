import jwt from "jsonwebtoken";

export default function (roles) {
  return function (req, res, next) {
    // Bypass role verification
    console.log("Role middleware bypassed");
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
      
      const { roles: userRoles } = jwt.verify(token, "secret1234");
      
      let hasRole = false;
      userRoles.forEach((role) => {
        if (roles.includes(role)) {
          hasRole = true;
        }
      });
      
      if (!hasRole) {
        return res.status(403).json({ message: "У вас нет доступа" });
      }
      
      return next();
    } catch (e) {
      console.log("Ошибка проверки ролей:", e);
      return res.status(403).json({ message: "Ошибка проверки прав доступа", error: e.message });
    }
    */
  };
}
