import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { insertUserSchema, type User } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      fullName: string;
      role: string;
      clusterId: string | null;
      unitId: string | null;
    }
  }
}

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Tên đăng nhập không tồn tại" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return done(null, false, { message: "Mật khẩu không đúng" });
      }

      return done(null, {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        clusterId: user.clusterId,
        unitId: user.unitId,
      });
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) {
      return done(null, false);
    }
    done(null, {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      clusterId: user.clusterId,
      unitId: user.unitId,
    });
  } catch (err) {
    done(err);
  }
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Vui lòng đăng nhập" });
  }
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }
    if (!roles.includes(req.user!.role)) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập" });
    }
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  // Only admins can create users (removed public registration to prevent privilege escalation)
  app.post("/api/auth/register", requireRole("admin"), async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      res.json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        clusterId: user.clusterId,
        unitId: user.unitId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Đăng nhập thất bại" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Đăng xuất thành công" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json(req.user);
  });

  // Cluster routes (Admin only)
  app.get("/api/clusters", requireAuth, async (req, res, next) => {
    try {
      const clusters = await storage.getClusters();
      res.json(clusters);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/clusters", requireRole("admin"), async (req, res, next) => {
    try {
      const cluster = await storage.createCluster(req.body);
      res.json(cluster);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/clusters/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const cluster = await storage.updateCluster(req.params.id, req.body);
      if (!cluster) {
        return res.status(404).json({ message: "Không tìm thấy cụm thi đua" });
      }
      res.json(cluster);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/clusters/:id", requireRole("admin"), async (req, res, next) => {
    try {
      await storage.deleteCluster(req.params.id);
      res.json({ message: "Xóa thành công" });
    } catch (error) {
      next(error);
    }
  });

  // Unit routes
  app.get("/api/units", requireAuth, async (req, res, next) => {
    try {
      const clusterId = req.query.clusterId as string | undefined;
      const units = await storage.getUnits(clusterId);
      res.json(units);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/units", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const unit = await storage.createUnit(req.body);
      res.json(unit);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/units/:id", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const unit = await storage.updateUnit(req.params.id, req.body);
      if (!unit) {
        return res.status(404).json({ message: "Không tìm thấy đơn vị" });
      }
      res.json(unit);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/units/:id", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      await storage.deleteUnit(req.params.id);
      res.json({ message: "Xóa thành công" });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
