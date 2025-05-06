import jwt from "jsonwebtoken";

export default function (roles) {
  return function (req, res, next) {
    // Bypass role verification
    console.log("Role middleware bypassed");
    return next();
    
    
  };
}
