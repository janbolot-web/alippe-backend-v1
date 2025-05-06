import jwt from "jsonwebtoken";

export default (req, res, next) => {
  // Simply pass through all requests without authentication
  console.log("Authentication middleware bypassed");
  req.userId = "bypassed-auth"; // Set a default user ID
  return next();
  
};
