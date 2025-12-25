import prisma from "../../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "accesssecret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refreshsecret";

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    ACCESS_SECRET,
    { expiresIn: "15min" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id },
    REFRESH_SECRET,
    { expiresIn: "5d" }
  );
}

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Missing username or password" });
    }
    
    const user = await prisma.users.findUnique({ where: { username } });
    
    if (!user) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }
    
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Store refresh token
    await prisma.refresh_tokens.create({
      data: {
        user_id: user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    });

    // Send user info (excluding password)
    const { password_hash: _, ...safeUser } = user;
    
    res.json({
      message: "Login successful",
      user: safeUser,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT_NAME;
    const payload = { error: "Login failed" };
    if (!isProduction) {
      payload.details = error?.message;
      payload.code = error?.code;
      payload.meta = error?.meta;
    }
    res.status(500).json(payload);
  }
};

export const refresh = async (req, res) => {
  try {
    const token = req.body?.refreshToken || req.cookies?.refresh_token;
    
    if (!token) {
      return res.status(401).json({ error: "No refresh token" });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, REFRESH_SECRET);
    } catch (err) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }
    
    const stored = await prisma.refresh_tokens.findFirst({
      where: { user_id: decoded.userId, token },
    });
    
    if (!stored) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }
    
    // Check if token is expired
    if (stored.expires_at < new Date()) {
      await prisma.refresh_tokens.delete({ where: { id: stored.id } });
      return res.status(403).json({ error: "Refresh token expired" });
    }
    
    // Generate new access token
    const user = await prisma.users.findUnique({ 
      where: { id: decoded.userId } 
    });
    
    if (!user) {
      return res.status(403).json({ error: "User not found" });
    }
    
    const newAccess = generateAccessToken(user);

    res.json({ message: "Access token refreshed", accessToken: newAccess });
  } catch (err) {
    res.status(403).json({ error: "Refresh failed" });
  }
};
  
export const logout = async (req, res) => {
  try {
    const token = req.body?.refreshToken || req.cookies?.refresh_token;
    if (token) await prisma.refresh_tokens.deleteMany({ where: { token } });

    res.json({ message: "Logged out" });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: "Logout failed" });
  }
};

  export const getMe = async (req, res) => {
    try {
      // Check if user is set by middleware
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const userId = req.user.userId;
      
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          full_name: true,
          role: true,
          phone_number: true,
          created_at: true,
        }
      });
  
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user info" });
    }
  }

