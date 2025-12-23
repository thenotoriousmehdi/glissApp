import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "accesssecret";

export default function authMiddleware(req, res, next) {
  const token = req.cookies.access_token;
  

  
  if (!token) {
  
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }
  
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
  
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: "Token expired",
        expiredAt: error.expiredAt 
      });
    }
    
    return res.status(403).json({ 
      error: "Invalid token",
      message: error.message 
    });
  }
}