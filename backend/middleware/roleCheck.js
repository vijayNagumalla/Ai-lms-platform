// Role-based access control middleware
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user exists in request (set by auth middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Normalize role names to handle both formats
      const userRole = req.user.role;
      const normalizedUserRole = userRole === 'super_admin' ? 'super-admin' : userRole;
      
      // Check if user has required role (check both formats)
      const hasRole = allowedRoles.some(role => {
        if (role === 'super-admin') {
          return normalizedUserRole === 'super-admin' || userRole === 'super_admin';
        }
        return role === userRole;
      });

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions. Required roles: ' + allowedRoles.join(', ')
        });
      }

      // User has required role, proceed
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during role verification'
      });
    }
  };
};

// Check if user is super admin
export const requireSuperAdmin = (req, res, next) => {
  return requireRole(['super_admin'])(req, res, next);
};

// Check if user is admin or super admin
export const requireAdmin = (req, res, next) => {
  return requireRole(['admin', 'super_admin'])(req, res, next);
};

// Check if user is instructor, admin, or super admin
export const requireInstructor = (req, res, next) => {
  return requireRole(['instructor', 'admin', 'super_admin'])(req, res, next);
};

// Check if user is student
export const requireStudent = (req, res, next) => {
  return requireRole(['student'])(req, res, next);
};

