import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertClusterSchema,
  insertUnitSchema,
  insertCriteriaGroupSchema,
  insertCriteriaSchema,
  insertEvaluationPeriodSchema,
  insertEvaluationSchema,
  insertScoreSchema,
  type User 
} from "@shared/schema";
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
  // Admins can create any user; cluster_leaders can only create users in their cluster
  app.post("/api/auth/register", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
      }

      // Cluster leader constraints
      if (req.user!.role === "cluster_leader") {
        // Cluster leaders can only create users with role "user"
        if (userData.role !== "user") {
          return res.status(403).json({ message: "Cụm trưởng chỉ có thể tạo người dùng đơn vị" });
        }
        
        // Force cluster to leader's cluster
        if (!req.user!.clusterId) {
          return res.status(400).json({ message: "Cụm trưởng chưa được gán vào cụm" });
        }
        
        // Verify unitId belongs to cluster leader's cluster
        if (!userData.unitId) {
          return res.status(400).json({ message: "Phải chọn đơn vị cho người dùng" });
        }
        
        const unit = await storage.getUnit(userData.unitId);
        if (!unit || unit.clusterId !== req.user!.clusterId) {
          return res.status(403).json({ message: "Đơn vị không thuộc cụm của bạn" });
        }
        
        // Force clusterId to leader's cluster (in case frontend sends wrong value)
        userData.clusterId = req.user!.clusterId;
      }

      // Admin validation (unchanged)
      if (req.user!.role === "admin") {
        if (userData.role === "admin") {
          if (userData.clusterId || userData.unitId) {
            return res.status(400).json({ message: "Quản trị viên không được gán vào cụm hoặc đơn vị" });
          }
        }
        
        if (userData.role === "cluster_leader") {
          if (!userData.clusterId) {
            return res.status(400).json({ message: "Cụm trưởng phải được gán vào một cụm" });
          }
        }
        
        if (userData.role === "user") {
          if (!userData.unitId) {
            return res.status(400).json({ message: "Người dùng đơn vị phải được gán vào một đơn vị" });
          }
        }
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

  // User management routes
  function sanitizeUser(user: any) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  app.get("/api/users", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      let users = await storage.getUsers();
      const units = await storage.getUnits();
      
      // Filter users by cluster for cluster_leader
      if (req.user!.role === "cluster_leader" && req.user!.clusterId) {
        // Cluster leaders can only see users in their cluster
        users = users.filter(u => 
          u.clusterId === req.user!.clusterId || 
          (u.unitId && units.some(unit => unit.id === u.unitId && unit.clusterId === req.user!.clusterId))
        );
      }
      
      // Support explicit clusterId filter from query params
      const clusterIdFilter = req.query.clusterId as string | undefined;
      if (clusterIdFilter) {
        users = users.filter(u => 
          u.clusterId === clusterIdFilter ||
          (u.unitId && units.some(unit => unit.id === u.unitId && unit.clusterId === clusterIdFilter))
        );
      }
      
      const sanitized = users.map(sanitizeUser);
      res.json(sanitized);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/users/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const updateUserSchema = insertUserSchema.partial().extend({
        password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự").optional(),
      });
      
      const userData = updateUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUser(req.params.id);
      if (!existingUser) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      // Prevent self-demotion from admin
      if (req.user!.id === req.params.id && userData.role && userData.role !== "admin") {
        return res.status(400).json({ message: "Không thể tự thay đổi quyền admin của mình" });
      }

      // Check username uniqueness if changing username
      if (userData.username && userData.username !== existingUser.username) {
        const existingUsername = await storage.getUserByUsername(userData.username);
        if (existingUsername) {
          return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
        }
      }

      // Validate role-specific requirements
      const finalRole = userData.role || existingUser.role;
      const finalClusterId = userData.clusterId !== undefined ? userData.clusterId : existingUser.clusterId;
      const finalUnitId = userData.unitId !== undefined ? userData.unitId : existingUser.unitId;
      
      if (finalRole === "admin") {
        if (finalClusterId || finalUnitId) {
          return res.status(400).json({ message: "Quản trị viên không được gán vào cụm hoặc đơn vị" });
        }
      }
      
      if (finalRole === "cluster_leader") {
        if (!finalClusterId) {
          return res.status(400).json({ message: "Cụm trưởng phải được gán vào một cụm" });
        }
      }
      
      if (finalRole === "user") {
        if (!finalUnitId) {
          return res.status(400).json({ message: "Người dùng đơn vị phải được gán vào một đơn vị" });
        }
      }

      // Hash password if provided
      const updateData: any = { ...userData };
      if (userData.password) {
        updateData.password = await bcrypt.hash(userData.password, 10);
      }

      // Ensure at least one admin remains if demoting current admin
      if (existingUser.role === "admin" && userData.role && userData.role !== "admin") {
        const allUsers = await storage.getUsers();
        const adminCount = allUsers.filter(u => u.role === "admin").length;
        if (adminCount <= 1) {
          return res.status(400).json({ message: "Phải có ít nhất một quản trị viên trong hệ thống" });
        }
      }

      const updatedUser = await storage.updateUser(req.params.id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/users/:id", requireRole("admin"), async (req, res, next) => {
    try {
      // Prevent self-deletion
      if (req.user!.id === req.params.id) {
        return res.status(400).json({ message: "Không thể xóa tài khoản của chính mình" });
      }

      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }

      // Ensure at least one admin remains
      if (targetUser.role === "admin") {
        const allUsers = await storage.getUsers();
        const adminCount = allUsers.filter(u => u.role === "admin").length;
        if (adminCount <= 1) {
          return res.status(400).json({ message: "Không thể xóa quản trị viên cuối cùng" });
        }
      }

      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Cluster routes (Admin only)
  app.get("/api/clusters", requireAuth, async (req, res, next) => {
    try {
      const clusters = await storage.getClusters();
      
      // Admin can see all clusters
      if (req.user!.role === "admin") {
        return res.json(clusters);
      }
      
      // Cluster leaders and unit users can only see their own cluster
      if (!req.user!.clusterId) {
        return res.json([]); // No cluster assigned
      }
      
      const userClusters = clusters.filter(c => c.id === req.user!.clusterId);
      res.json(userClusters);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/clusters", requireRole("admin"), async (req, res, next) => {
    try {
      const clusterData = insertClusterSchema.parse(req.body);
      const cluster = await storage.createCluster(clusterData);
      res.json(cluster);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/clusters/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const clusterData = insertClusterSchema.partial().parse(req.body);
      const cluster = await storage.updateCluster(req.params.id, clusterData);
      if (!cluster) {
        return res.status(404).json({ message: "Không tìm thấy cụm thi đua" });
      }
      res.json(cluster);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/clusters/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const existingCluster = await storage.getCluster(req.params.id);
      if (!existingCluster) {
        return res.status(404).json({ message: "Không tìm thấy cụm thi đua" });
      }
      
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
      
      // Admin can see all units or filter by clusterId
      if (req.user!.role === "admin") {
        const units = await storage.getUnits(clusterId);
        return res.json(units);
      }
      
      // Cluster leaders and unit users can only see units in their cluster
      if (!req.user!.clusterId) {
        return res.json([]); // No cluster assigned
      }
      
      // If clusterId is provided, validate it matches user's cluster
      if (clusterId && clusterId !== req.user!.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể xem đơn vị trong cụm của mình" });
      }
      
      // Return units in user's cluster
      const units = await storage.getUnits(req.user!.clusterId);
      res.json(units);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/units", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const unitData = insertUnitSchema.parse(req.body);
      
      // Cluster leaders can only create units in their own cluster
      if (req.user!.role === "cluster_leader" && unitData.clusterId !== req.user!.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể tạo đơn vị trong cụm của mình" });
      }
      
      const unit = await storage.createUnit(unitData);
      res.json(unit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/units/:id", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const unitData = insertUnitSchema.partial().parse(req.body);
      
      // Check if unit exists and belongs to user's cluster
      const existingUnit = await storage.getUnit(req.params.id);
      if (!existingUnit) {
        return res.status(404).json({ message: "Không tìm thấy đơn vị" });
      }
      
      if (req.user!.role === "cluster_leader") {
        if (existingUnit.clusterId !== req.user!.clusterId) {
          return res.status(403).json({ message: "Bạn chỉ có thể sửa đơn vị trong cụm của mình" });
        }
        
        // Cluster leaders cannot reassign units to different clusters
        if (unitData.clusterId && unitData.clusterId !== existingUnit.clusterId) {
          return res.status(403).json({ message: "Bạn không có quyền chuyển đơn vị sang cụm khác" });
        }
      }
      
      const unit = await storage.updateUnit(req.params.id, unitData);
      res.json(unit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/units/:id", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const existingUnit = await storage.getUnit(req.params.id);
      if (!existingUnit) {
        return res.status(404).json({ message: "Không tìm thấy đơn vị" });
      }
      
      if (req.user!.role === "cluster_leader" && existingUnit.clusterId !== req.user!.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể xóa đơn vị trong cụm của mình" });
      }
      
      await storage.deleteUnit(req.params.id);
      res.json({ message: "Xóa thành công" });
    } catch (error) {
      next(error);
    }
  });

  // Criteria Group routes
  app.get("/api/criteria-groups", requireAuth, async (req, res, next) => {
    try {
      const { clusterId, year } = req.query;
      if (!clusterId || !year) {
        return res.status(400).json({ message: "Thiếu clusterId hoặc year" });
      }
      const yearNum = parseInt(year as string);
      if (isNaN(yearNum)) {
        return res.status(400).json({ message: "year phải là số hợp lệ" });
      }
      
      // Cluster leaders and unit users can only view groups in their own cluster
      if (req.user!.role !== "admin" && req.user!.clusterId !== clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể xem nhóm tiêu chí của cụm mình" });
      }
      
      const groups = await storage.getCriteriaGroups(clusterId as string, yearNum);
      res.json(groups);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/criteria-groups", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const groupData = insertCriteriaGroupSchema.parse(req.body);
      
      // Cluster leaders can only create groups for their own cluster
      if (req.user!.role === "cluster_leader" && groupData.clusterId !== req.user!.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể tạo nhóm tiêu chí cho cụm của mình" });
      }
      
      const group = await storage.createCriteriaGroup(groupData);
      res.json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/criteria-groups/:id", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const groupData = insertCriteriaGroupSchema.partial().parse(req.body);
      
      const existingGroup = await storage.getCriteriaGroup(req.params.id);
      if (!existingGroup) {
        return res.status(404).json({ message: "Không tìm thấy nhóm tiêu chí" });
      }
      
      if (req.user!.role === "cluster_leader") {
        if (existingGroup.clusterId !== req.user!.clusterId) {
          return res.status(403).json({ message: "Bạn chỉ có thể sửa nhóm tiêu chí của cụm mình" });
        }
        
        // Cluster leaders cannot reassign groups to different clusters
        if (groupData.clusterId && groupData.clusterId !== existingGroup.clusterId) {
          return res.status(403).json({ message: "Bạn không có quyền chuyển nhóm tiêu chí sang cụm khác" });
        }
      }
      
      const group = await storage.updateCriteriaGroup(req.params.id, groupData);
      res.json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/criteria-groups/:id", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const existingGroup = await storage.getCriteriaGroup(req.params.id);
      if (!existingGroup) {
        return res.status(404).json({ message: "Không tìm thấy nhóm tiêu chí" });
      }
      
      if (req.user!.role === "cluster_leader" && existingGroup.clusterId !== req.user!.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể xóa nhóm tiêu chí của cụm mình" });
      }
      
      await storage.deleteCriteriaGroup(req.params.id);
      res.json({ message: "Xóa thành công" });
    } catch (error) {
      next(error);
    }
  });

  // Criteria routes
  app.get("/api/criteria", requireAuth, async (req, res, next) => {
    try {
      const { groupId } = req.query;
      if (!groupId) {
        return res.status(400).json({ message: "Thiếu groupId" });
      }
      
      // Verify the group exists and check cluster ownership
      const group = await storage.getCriteriaGroup(groupId as string);
      if (!group) {
        return res.status(404).json({ message: "Không tìm thấy nhóm tiêu chí" });
      }
      
      // Cluster leaders and unit users can only view criteria in their own cluster
      if (req.user!.role !== "admin" && req.user!.clusterId !== group.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể xem tiêu chí của cụm mình" });
      }
      
      const criteria = await storage.getCriteria(groupId as string);
      res.json(criteria);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/criteria/:id", requireAuth, async (req, res, next) => {
    try {
      const criteria = await storage.getCriteriaById(req.params.id);
      if (!criteria) {
        return res.status(404).json({ message: "Không tìm thấy tiêu chí" });
      }
      
      // Verify cluster ownership via parent group
      const group = await storage.getCriteriaGroup(criteria.groupId);
      if (req.user!.role !== "admin" && group && req.user!.clusterId !== group.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể xem tiêu chí của cụm mình" });
      }
      
      res.json(criteria);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/criteria", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const criteriaData = insertCriteriaSchema.parse(req.body);
      
      // Verify the group belongs to the user's cluster
      const group = await storage.getCriteriaGroup(criteriaData.groupId);
      if (!group) {
        return res.status(404).json({ message: "Không tìm thấy nhóm tiêu chí" });
      }
      
      if (req.user!.role === "cluster_leader" && group.clusterId !== req.user!.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể tạo tiêu chí cho cụm của mình" });
      }
      
      const criteria = await storage.createCriteria(criteriaData);
      res.json(criteria);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/criteria/:id", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const criteriaData = insertCriteriaSchema.partial().parse(req.body);
      
      const existingCriteria = await storage.getCriteriaById(req.params.id);
      if (!existingCriteria) {
        return res.status(404).json({ message: "Không tìm thấy tiêu chí" });
      }
      
      const group = await storage.getCriteriaGroup(existingCriteria.groupId);
      if (req.user!.role === "cluster_leader") {
        if (group && group.clusterId !== req.user!.clusterId) {
          return res.status(403).json({ message: "Bạn chỉ có thể sửa tiêu chí của cụm mình" });
        }
        
        // If reassigning to a different group, verify the new group is in their cluster
        if (criteriaData.groupId && criteriaData.groupId !== existingCriteria.groupId) {
          const newGroup = await storage.getCriteriaGroup(criteriaData.groupId);
          if (!newGroup || newGroup.clusterId !== req.user!.clusterId) {
            return res.status(403).json({ message: "Bạn chỉ có thể chuyển tiêu chí đến nhóm trong cụm của mình" });
          }
        }
      }
      
      const criteria = await storage.updateCriteria(req.params.id, criteriaData);
      res.json(criteria);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/criteria/:id", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const existingCriteria = await storage.getCriteriaById(req.params.id);
      if (!existingCriteria) {
        return res.status(404).json({ message: "Không tìm thấy tiêu chí" });
      }
      
      const group = await storage.getCriteriaGroup(existingCriteria.groupId);
      if (req.user!.role === "cluster_leader" && group && group.clusterId !== req.user!.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể xóa tiêu chí của cụm mình" });
      }
      
      await storage.deleteCriteria(req.params.id);
      res.json({ message: "Xóa thành công" });
    } catch (error) {
      next(error);
    }
  });

  // Evaluation Period routes
  app.get("/api/evaluation-periods", requireAuth, async (req, res, next) => {
    try {
      // Admin sees all periods, others only see their cluster's periods
      let clusterId = req.query.clusterId as string | undefined;
      
      if (req.user!.role !== "admin") {
        // Force non-admin users to only see their cluster's periods
        clusterId = req.user!.clusterId || undefined;
        if (!clusterId) {
          return res.status(403).json({ message: "Bạn chưa được gán vào cụm thi đua nào" });
        }
      }
      
      const periods = await storage.getEvaluationPeriods(clusterId);
      res.json(periods);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/evaluation-periods/:id", requireAuth, async (req, res, next) => {
    try {
      const period = await storage.getEvaluationPeriod(req.params.id);
      if (!period) {
        return res.status(404).json({ message: "Không tìm thấy kỳ thi đua" });
      }
      
      // Non-admin users can only view periods from their cluster
      if (req.user!.role !== "admin" && period.clusterId !== req.user!.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể xem kỳ thi đua của cụm mình" });
      }
      
      res.json(period);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/evaluation-periods", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const periodData = insertEvaluationPeriodSchema.parse(req.body);
      
      // Cluster leaders can only create periods for their own cluster
      if (req.user!.role === "cluster_leader" && periodData.clusterId !== req.user!.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể tạo kỳ thi đua cho cụm của mình" });
      }
      
      const period = await storage.createEvaluationPeriod(periodData);
      res.json(period);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/evaluation-periods/:id", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const periodData = insertEvaluationPeriodSchema.partial().parse(req.body);
      
      const existingPeriod = await storage.getEvaluationPeriod(req.params.id);
      if (!existingPeriod) {
        return res.status(404).json({ message: "Không tìm thấy kỳ thi đua" });
      }
      
      if (req.user!.role === "cluster_leader") {
        if (existingPeriod.clusterId !== req.user!.clusterId) {
          return res.status(403).json({ message: "Bạn chỉ có thể sửa kỳ thi đua của cụm mình" });
        }
        
        // Cluster leaders cannot reassign periods to different clusters
        if (periodData.clusterId && periodData.clusterId !== existingPeriod.clusterId) {
          return res.status(403).json({ message: "Bạn không có quyền chuyển kỳ thi đua sang cụm khác" });
        }
      }
      
      const period = await storage.updateEvaluationPeriod(req.params.id, periodData);
      res.json(period);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/evaluation-periods/:id", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const existingPeriod = await storage.getEvaluationPeriod(req.params.id);
      if (!existingPeriod) {
        return res.status(404).json({ message: "Không tìm thấy kỳ thi đua" });
      }
      
      if (req.user!.role === "cluster_leader" && existingPeriod.clusterId !== req.user!.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể xóa kỳ thi đua của cụm mình" });
      }
      
      await storage.deleteEvaluationPeriod(req.params.id);
      res.json({ message: "Xóa thành công" });
    } catch (error) {
      next(error);
    }
  });

  // Evaluation routes
  app.get("/api/evaluations", requireAuth, async (req, res, next) => {
    try {
      const { periodId, unitId } = req.query;
      let evaluations = await storage.getEvaluations(periodId as string | undefined, unitId as string | undefined);
      
      // Filter evaluations based on user role and cluster ownership
      if (req.user!.role !== "admin") {
        // Fetch all units for evaluations to filter by cluster
        const evaluationsWithUnits = await Promise.all(
          evaluations.map(async (evaluation) => {
            const unit = await storage.getUnit(evaluation.unitId);
            return { evaluation, unit };
          })
        );
        
        evaluations = evaluationsWithUnits
          .filter(({ evaluation, unit }) => {
            if (!unit) return false;
            
            // Cluster leaders can see all evaluations in their cluster
            if (req.user!.role === "cluster_leader") {
              return unit.clusterId === req.user!.clusterId;
            }
            
            // Regular users can only see their own unit's evaluations
            return evaluation.unitId === req.user!.unitId;
          })
          .map(({ evaluation }) => evaluation);
      }
      
      res.json(evaluations);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/evaluations/:id", requireAuth, async (req, res, next) => {
    try {
      const evaluation = await storage.getEvaluation(req.params.id);
      if (!evaluation) {
        return res.status(404).json({ message: "Không tìm thấy đánh giá" });
      }
      
      // Verify access based on role and ownership
      const unit = await storage.getUnit(evaluation.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Không tìm thấy đơn vị" });
      }
      
      if (req.user!.role !== "admin") {
        if (req.user!.role === "cluster_leader" && unit.clusterId !== req.user!.clusterId) {
          return res.status(403).json({ message: "Bạn chỉ có thể xem đánh giá của cụm mình" });
        }
        
        if (req.user!.role === "user" && evaluation.unitId !== req.user!.unitId) {
          return res.status(403).json({ message: "Bạn chỉ có thể xem đánh giá của đơn vị mình" });
        }
      }
      
      res.json(evaluation);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/evaluations", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const evaluationData = insertEvaluationSchema.parse(req.body);
      
      // Verify the unit exists and check cluster ownership
      const unit = await storage.getUnit(evaluationData.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Không tìm thấy đơn vị" });
      }
      
      // Cluster leaders can only create evaluations for units in their cluster
      if (req.user!.role === "cluster_leader" && unit.clusterId !== req.user!.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể tạo đánh giá cho đơn vị trong cụm của mình" });
      }
      
      const evaluation = await storage.createEvaluation(evaluationData);
      res.json(evaluation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/evaluations/:id", requireAuth, async (req, res, next) => {
    try {
      const evaluationData = insertEvaluationSchema.partial().parse(req.body);
      
      const existingEvaluation = await storage.getEvaluation(req.params.id);
      if (!existingEvaluation) {
        return res.status(404).json({ message: "Không tìm thấy đánh giá" });
      }
      
      // Users can only update evaluations for their own unit
      if (req.user!.role === "user" && existingEvaluation.unitId !== req.user!.unitId) {
        return res.status(403).json({ message: "Bạn chỉ có thể sửa đánh giá của đơn vị mình" });
      }
      
      // Cluster leaders can only update evaluations for units in their cluster
      if (req.user!.role === "cluster_leader") {
        const unit = await storage.getUnit(existingEvaluation.unitId);
        if (unit && unit.clusterId !== req.user!.clusterId) {
          return res.status(403).json({ message: "Bạn chỉ có thể sửa đánh giá của cụm mình" });
        }
        
        // If reassigning to a different unit, verify the new unit is also in their cluster
        if (evaluationData.unitId && evaluationData.unitId !== existingEvaluation.unitId) {
          const newUnit = await storage.getUnit(evaluationData.unitId);
          if (!newUnit || newUnit.clusterId !== req.user!.clusterId) {
            return res.status(403).json({ message: "Bạn chỉ có thể chuyển đánh giá đến đơn vị trong cụm của mình" });
          }
        }
      }
      
      // Regular users cannot reassign evaluations to different units
      if (req.user!.role === "user" && evaluationData.unitId && evaluationData.unitId !== existingEvaluation.unitId) {
        return res.status(403).json({ message: "Bạn không có quyền chuyển đánh giá sang đơn vị khác" });
      }
      
      const evaluation = await storage.updateEvaluation(req.params.id, evaluationData);
      res.json(evaluation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  // Batch create evaluations for all units in a period
  app.post("/api/evaluation-periods/:id/create-evaluations", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const period = await storage.getEvaluationPeriod(req.params.id);
      if (!period) {
        return res.status(404).json({ message: "Không tìm thấy kỳ thi đua" });
      }
      
      // Cluster leaders can only create evaluations for their cluster's period
      if (req.user!.role === "cluster_leader" && period.clusterId !== req.user!.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể tạo đánh giá cho kỳ thi đua của cụm mình" });
      }
      
      // Get all units in the period's cluster
      const units = await storage.getUnits(period.clusterId);
      
      // Create evaluations for each unit
      const evaluations = [];
      for (const unit of units) {
        // Check if evaluation already exists
        const existing = await storage.getEvaluations(req.params.id, unit.id);
        if (existing.length === 0) {
          const evaluation = await storage.createEvaluation({
            periodId: req.params.id,
            unitId: unit.id,
            status: "draft",
          });
          evaluations.push(evaluation);
        }
      }
      
      res.json({ message: `Đã tạo ${evaluations.length} đánh giá`, evaluations });
    } catch (error) {
      next(error);
    }
  });

  // Submit self-assessment (Unit user)
  app.post("/api/evaluations/:id/submit", requireAuth, async (req, res, next) => {
    try {
      const evaluation = await storage.getEvaluation(req.params.id);
      if (!evaluation) {
        return res.status(404).json({ message: "Không tìm thấy đánh giá" });
      }
      
      // Only unit users can submit their own evaluation
      if (req.user!.role !== "user" || evaluation.unitId !== req.user!.unitId) {
        return res.status(403).json({ message: "Bạn chỉ có thể nộp đánh giá của đơn vị mình" });
      }
      
      // Can only submit from draft status
      if (evaluation.status !== "draft") {
        return res.status(400).json({ message: "Chỉ có thể nộp đánh giá ở trạng thái nháp" });
      }
      
      const updated = await storage.updateEvaluation(req.params.id, { status: "submitted" });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // Complete review 1 (Cluster leader)
  app.post("/api/evaluations/:id/review1", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const evaluation = await storage.getEvaluation(req.params.id);
      if (!evaluation) {
        return res.status(404).json({ message: "Không tìm thấy đánh giá" });
      }
      
      const unit = await storage.getUnit(evaluation.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Không tìm thấy đơn vị" });
      }
      
      // Cluster leaders can only review their cluster's evaluations
      if (req.user!.role === "cluster_leader" && unit.clusterId !== req.user!.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể thẩm định đánh giá của cụm mình" });
      }
      
      // Can only review from submitted status
      if (evaluation.status !== "submitted") {
        return res.status(400).json({ message: "Chỉ có thể thẩm định đánh giá đã nộp" });
      }
      
      const updated = await storage.updateEvaluation(req.params.id, { status: "review1_completed" });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // Submit explanation (Unit user)
  app.post("/api/evaluations/:id/explain", requireAuth, async (req, res, next) => {
    try {
      const evaluation = await storage.getEvaluation(req.params.id);
      if (!evaluation) {
        return res.status(404).json({ message: "Không tìm thấy đánh giá" });
      }
      
      // Only unit users can submit explanation for their own evaluation
      if (req.user!.role !== "user" || evaluation.unitId !== req.user!.unitId) {
        return res.status(403).json({ message: "Bạn chỉ có thể giải trình cho đánh giá của đơn vị mình" });
      }
      
      // Can only explain from review1_completed status
      if (evaluation.status !== "review1_completed") {
        return res.status(400).json({ message: "Chỉ có thể giải trình sau khi hoàn thành thẩm định lần 1" });
      }
      
      const updated = await storage.updateEvaluation(req.params.id, { status: "explanation_submitted" });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // Complete review 2 (Cluster leader)
  app.post("/api/evaluations/:id/review2", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const evaluation = await storage.getEvaluation(req.params.id);
      if (!evaluation) {
        return res.status(404).json({ message: "Không tìm thấy đánh giá" });
      }
      
      const unit = await storage.getUnit(evaluation.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Không tìm thấy đơn vị" });
      }
      
      // Cluster leaders can only review their cluster's evaluations
      if (req.user!.role === "cluster_leader" && unit.clusterId !== req.user!.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể thẩm định đánh giá của cụm mình" });
      }
      
      // Can only review2 from explanation_submitted status
      if (evaluation.status !== "explanation_submitted") {
        return res.status(400).json({ message: "Chỉ có thể thẩm định lần 2 sau khi đơn vị giải trình" });
      }
      
      const updated = await storage.updateEvaluation(req.params.id, { status: "review2_completed" });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // Finalize evaluation (Admin/Cluster leader)
  app.post("/api/evaluations/:id/finalize", requireRole("admin", "cluster_leader"), async (req, res, next) => {
    try {
      const evaluation = await storage.getEvaluation(req.params.id);
      if (!evaluation) {
        return res.status(404).json({ message: "Không tìm thấy đánh giá" });
      }
      
      const unit = await storage.getUnit(evaluation.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Không tìm thấy đơn vị" });
      }
      
      // Cluster leaders can only finalize their cluster's evaluations
      if (req.user!.role === "cluster_leader" && unit.clusterId !== req.user!.clusterId) {
        return res.status(403).json({ message: "Bạn chỉ có thể hoàn tất đánh giá của cụm mình" });
      }
      
      // Can only finalize from review2_completed status
      if (evaluation.status !== "review2_completed") {
        return res.status(400).json({ message: "Chỉ có thể hoàn tất sau khi hoàn thành thẩm định lần 2" });
      }
      
      const updated = await storage.updateEvaluation(req.params.id, { status: "finalized" });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // Score routes
  app.get("/api/scores", requireAuth, async (req, res, next) => {
    try {
      const { evaluationId } = req.query;
      if (!evaluationId) {
        return res.status(400).json({ message: "Thiếu evaluationId" });
      }
      
      // Verify evaluation exists and check access
      const evaluation = await storage.getEvaluation(evaluationId as string);
      if (!evaluation) {
        return res.status(404).json({ message: "Không tìm thấy đánh giá" });
      }
      
      // Check cluster ownership
      const unit = await storage.getUnit(evaluation.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Không tìm thấy đơn vị" });
      }
      
      if (req.user!.role !== "admin") {
        if (req.user!.role === "cluster_leader" && unit.clusterId !== req.user!.clusterId) {
          return res.status(403).json({ message: "Bạn chỉ có thể xem điểm của cụm mình" });
        }
        
        if (req.user!.role === "user" && evaluation.unitId !== req.user!.unitId) {
          return res.status(403).json({ message: "Bạn chỉ có thể xem điểm của đơn vị mình" });
        }
      }
      
      const scores = await storage.getScores(evaluationId as string);
      res.json(scores);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/scores/:id", requireAuth, async (req, res, next) => {
    try {
      const score = await storage.getScore(req.params.id);
      if (!score) {
        return res.status(404).json({ message: "Không tìm thấy điểm" });
      }
      
      // Get the evaluation to check permissions
      const evaluation = await storage.getEvaluation(score.evaluationId);
      if (!evaluation) {
        return res.status(404).json({ message: "Không tìm thấy đánh giá" });
      }
      
      // Check cluster ownership
      const unit = await storage.getUnit(evaluation.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Không tìm thấy đơn vị" });
      }
      
      if (req.user!.role !== "admin") {
        if (req.user!.role === "cluster_leader" && unit.clusterId !== req.user!.clusterId) {
          return res.status(403).json({ message: "Bạn chỉ có thể xem điểm của cụm mình" });
        }
        
        if (req.user!.role === "user" && evaluation.unitId !== req.user!.unitId) {
          return res.status(403).json({ message: "Bạn chỉ có thể xem điểm của đơn vị mình" });
        }
      }
      
      res.json(score);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/scores", requireAuth, async (req, res, next) => {
    try {
      const scoreData = insertScoreSchema.parse(req.body);
      
      // Verify the evaluation exists and check permissions
      const evaluation = await storage.getEvaluation(scoreData.evaluationId);
      if (!evaluation) {
        return res.status(404).json({ message: "Không tìm thấy đánh giá" });
      }
      
      // Users can only create scores for their own unit's evaluation
      if (req.user!.role === "user" && evaluation.unitId !== req.user!.unitId) {
        return res.status(403).json({ message: "Bạn chỉ có thể tạo điểm cho đơn vị mình" });
      }
      
      // Cluster leaders can only create scores for evaluations in their cluster
      if (req.user!.role === "cluster_leader") {
        const unit = await storage.getUnit(evaluation.unitId);
        if (!unit || unit.clusterId !== req.user!.clusterId) {
          return res.status(403).json({ message: "Bạn chỉ có thể tạo điểm cho cụm của mình" });
        }
      }
      
      const score = await storage.createScore(scoreData);
      res.json(score);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/scores/:id", requireAuth, async (req, res, next) => {
    try {
      const scoreData = insertScoreSchema.partial().parse(req.body);
      
      const existingScore = await storage.getScore(req.params.id);
      if (!existingScore) {
        return res.status(404).json({ message: "Không tìm thấy điểm" });
      }
      
      // Get the evaluation to check permissions
      const evaluation = await storage.getEvaluation(existingScore.evaluationId);
      if (!evaluation) {
        return res.status(404).json({ message: "Không tìm thấy đánh giá" });
      }
      
      // Users can only update scores for their own unit's evaluation
      if (req.user!.role === "user" && evaluation.unitId !== req.user!.unitId) {
        return res.status(403).json({ message: "Bạn chỉ có thể sửa điểm của đơn vị mình" });
      }
      
      // Cluster leaders can only update scores for evaluations in their cluster
      if (req.user!.role === "cluster_leader") {
        const unit = await storage.getUnit(evaluation.unitId);
        if (unit && unit.clusterId !== req.user!.clusterId) {
          return res.status(403).json({ message: "Bạn chỉ có thể sửa điểm của cụm mình" });
        }
        
        // If reassigning to a different evaluation, verify the new evaluation is also in their cluster
        if (scoreData.evaluationId && scoreData.evaluationId !== existingScore.evaluationId) {
          const newEvaluation = await storage.getEvaluation(scoreData.evaluationId);
          if (!newEvaluation) {
            return res.status(404).json({ message: "Không tìm thấy đánh giá mới" });
          }
          const newUnit = await storage.getUnit(newEvaluation.unitId);
          if (!newUnit || newUnit.clusterId !== req.user!.clusterId) {
            return res.status(403).json({ message: "Bạn chỉ có thể chuyển điểm đến đánh giá trong cụm của mình" });
          }
        }
      }
      
      // Regular users cannot reassign scores to different evaluations
      if (req.user!.role === "user" && scoreData.evaluationId && scoreData.evaluationId !== existingScore.evaluationId) {
        return res.status(403).json({ message: "Bạn không có quyền chuyển điểm sang đánh giá khác" });
      }
      
      const score = await storage.updateScore(req.params.id, scoreData);
      res.json(score);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  // Bulk update scores for an evaluation (multi-stage scoring)
  app.put("/api/evaluations/:id/scores", requireAuth, async (req, res, next) => {
    try {
      const evaluation = await storage.getEvaluation(req.params.id);
      if (!evaluation) {
        return res.status(404).json({ message: "Không tìm thấy đánh giá" });
      }
      
      // Check cluster ownership
      const unit = await storage.getUnit(evaluation.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Không tìm thấy đơn vị" });
      }
      
      if (req.user!.role !== "admin") {
        if (req.user!.role === "cluster_leader" && unit.clusterId !== req.user!.clusterId) {
          return res.status(403).json({ message: "Bạn chỉ có thể cập nhật điểm của cụm mình" });
        }
        
        if (req.user!.role === "user" && evaluation.unitId !== req.user!.unitId) {
          return res.status(403).json({ message: "Bạn chỉ có thể cập nhật điểm của đơn vị mình" });
        }
      }
      
      // Parse and validate scores array
      const scoresData = z.array(z.object({
        criteriaId: z.string(),
        selfScore: z.number().optional(),
        selfScoreFile: z.string().optional(),
        review1Score: z.number().optional(),
        review1Comment: z.string().optional(),
        review1File: z.string().optional(),
        explanation: z.string().optional(),
        review2Score: z.number().optional(),
        review2Comment: z.string().optional(),
        review2File: z.string().optional(),
      })).parse(req.body.scores);
      
      // Stage-specific validation based on evaluation status and user role
      for (const scoreData of scoresData) {
        // Unit users can only update self-scoring before finalization
        if (req.user!.role === "user") {
          if (evaluation.status !== "draft" && evaluation.status !== "submitted") {
            if (scoreData.selfScore !== undefined || scoreData.selfScoreFile !== undefined) {
              return res.status(400).json({ message: "Chỉ có thể tự chấm điểm ở trạng thái nháp hoặc đã nộp" });
            }
          }
          
          // Unit users can only add explanation in review1_completed or explanation_submitted status
          if (evaluation.status !== "review1_completed" && evaluation.status !== "explanation_submitted") {
            if (scoreData.explanation !== undefined) {
              return res.status(400).json({ message: "Chỉ có thể giải trình sau khi hoàn thành thẩm định lần 1" });
            }
          }
          
          // Unit users cannot update review scores
          if (scoreData.review1Score !== undefined || scoreData.review1Comment !== undefined || scoreData.review1File !== undefined) {
            return res.status(403).json({ message: "Bạn không có quyền thẩm định" });
          }
          if (scoreData.review2Score !== undefined || scoreData.review2Comment !== undefined || scoreData.review2File !== undefined) {
            return res.status(403).json({ message: "Bạn không có quyền thẩm định" });
          }
        }
        
        // Cluster leaders validation (allow editing in appropriate states)
        if (req.user!.role === "cluster_leader" || req.user!.role === "admin") {
          // Can update review1 in submitted or later states (before finalized)
          if (scoreData.review1Score !== undefined || scoreData.review1Comment !== undefined || scoreData.review1File !== undefined) {
            if (evaluation.status === "draft") {
              return res.status(400).json({ message: "Không thể thẩm định khi đơn vị chưa nộp" });
            }
            if (evaluation.status === "finalized") {
              return res.status(400).json({ message: "Không thể sửa điểm đã hoàn tất" });
            }
          }
          
          // Can update review2 in explanation_submitted, review2_completed, or finalized states
          if (scoreData.review2Score !== undefined || scoreData.review2Comment !== undefined || scoreData.review2File !== undefined) {
            if (evaluation.status !== "explanation_submitted" && evaluation.status !== "review2_completed" && evaluation.status !== "finalized") {
              return res.status(400).json({ message: "Chỉ có thể thẩm định lần 2 sau khi đơn vị giải trình" });
            }
          }
        }
      }
      
      // Fetch ALL existing scores once for this evaluation
      const allExistingScores = await storage.getScores(req.params.id);
      const updatedScores = [];
      
      for (const scoreData of scoresData) {
        // Find existing score
        let existingScore = allExistingScores.find(s => s.criteriaId === scoreData.criteriaId);
        
        let score;
        if (existingScore) {
          // Prepare update data with timestamps
          const updateData: any = {};
          
          if (scoreData.selfScore !== undefined) {
            updateData.selfScore = scoreData.selfScore.toString();
            updateData.selfScoreDate = new Date();
          }
          if (scoreData.selfScoreFile !== undefined) {
            updateData.selfScoreFile = scoreData.selfScoreFile;
          }
          
          if (scoreData.review1Score !== undefined) {
            updateData.review1Score = scoreData.review1Score.toString();
            updateData.review1Date = new Date();
          }
          if (scoreData.review1Comment !== undefined) {
            updateData.review1Comment = scoreData.review1Comment;
          }
          if (scoreData.review1File !== undefined) {
            updateData.review1File = scoreData.review1File;
          }
          
          if (scoreData.explanation !== undefined) {
            updateData.explanation = scoreData.explanation;
            updateData.explanationDate = new Date();
          }
          
          if (scoreData.review2Score !== undefined) {
            updateData.review2Score = scoreData.review2Score.toString();
            updateData.review2Date = new Date();
          }
          if (scoreData.review2Comment !== undefined) {
            updateData.review2Comment = scoreData.review2Comment;
          }
          if (scoreData.review2File !== undefined) {
            updateData.review2File = scoreData.review2File;
          }
          
          // Calculate finalScore: review2 ?? review1 ?? self (using nullish coalescing to preserve 0 scores)
          const currentSelf = scoreData.selfScore !== undefined ? scoreData.selfScore : (existingScore.selfScore !== null ? parseFloat(existingScore.selfScore) : 0);
          const currentReview1 = scoreData.review1Score !== undefined ? scoreData.review1Score : (existingScore.review1Score !== null ? parseFloat(existingScore.review1Score) : null);
          const currentReview2 = scoreData.review2Score !== undefined ? scoreData.review2Score : (existingScore.review2Score !== null ? parseFloat(existingScore.review2Score) : null);
          
          const finalScore = currentReview2 ?? currentReview1 ?? currentSelf;
          updateData.finalScore = finalScore.toString();
          
          score = await storage.updateScore(existingScore.id, updateData);
        } else {
          // Create new score
          const newScore: any = {
            evaluationId: req.params.id,
            criteriaId: scoreData.criteriaId,
          };
          
          if (scoreData.selfScore !== undefined) {
            newScore.selfScore = scoreData.selfScore.toString();
            newScore.selfScoreDate = new Date();
          }
          if (scoreData.selfScoreFile !== undefined) {
            newScore.selfScoreFile = scoreData.selfScoreFile;
          }
          
          // Calculate initial finalScore (use ?? to preserve 0 scores)
          const finalScore = scoreData.selfScore ?? 0;
          newScore.finalScore = finalScore.toString();
          
          score = await storage.createScore(newScore);
        }
        
        updatedScores.push(score);
      }
      
      // Recalculate totals from ALL scores for this evaluation (not just updated ones)
      const finalAllScores = await storage.getScores(req.params.id);
      let totalSelfScore = 0;
      let totalReview1Score = 0;
      let totalReview2Score = 0;
      let totalFinalScore = 0;
      
      for (const score of finalAllScores) {
        if (score.selfScore) totalSelfScore += parseFloat(score.selfScore);
        if (score.review1Score) totalReview1Score += parseFloat(score.review1Score);
        if (score.review2Score) totalReview2Score += parseFloat(score.review2Score);
        if (score.finalScore) totalFinalScore += parseFloat(score.finalScore);
      }
      
      // Update evaluation totals
      await storage.updateEvaluation(req.params.id, {
        totalSelfScore: totalSelfScore.toString(),
        totalReview1Score: totalReview1Score > 0 ? totalReview1Score.toString() : null,
        totalReview2Score: totalReview2Score > 0 ? totalReview2Score.toString() : null,
        totalFinalScore: totalFinalScore.toString(),
      });
      
      res.json({ message: "Cập nhật điểm thành công", scores: updatedScores });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors: error.errors });
      }
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
