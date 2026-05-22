import jsonwebtoken from "jsonwebtoken";
import userModel from "../models/user.model.js";

function authMiddleware(allowedRoles = []) {
  return async function (req, res, next) {
    try {
      const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }

      const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden"
        });
      }

      if (user.role === "mechanic") {
        if (user.isBlocked) {
          return res.status(403).json({
            success: false,
            message: "Mechanic account is blocked"
          });
        }

        if (!user.isVerified) {
          return res.status(403).json({
            success: false,
            message: "Mechanic account is pending verification"
          });
        }
      }

      req.user = user;
      req.auth = {
        userId: decoded.userId,
        role: decoded.role || user.role
      };

      next();
    } catch (err) {
      console.error(err);
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
  };
}

export default authMiddleware;