import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

// Dynamic mapping of roles to permissions (RBAC) to avoid DB overhead
const ROLE_PERMISSIONS: Record<string, string[]> = {
  USER: [],
  CHECKIN_STAFF: ['CHECKIN_SCAN', 'CHECKIN_VIEW_HISTORY'],
  ORGANIZER: ['AI_BIO_UPLOAD', 'CHECKIN_SCAN', 'CHECKIN_VIEW_HISTORY'],
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User session missing');
    }

    // Get permissions from token payload OR look up by role
    let userPermissions: string[] = user.permissions || [];
    
    if (userPermissions.length === 0) {
      const userRole = user.role || 'USER';
      userPermissions = ROLE_PERMISSIONS[userRole] || [];
    }

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
    
    if (!hasPermission) {
      throw new ForbiddenException('You do not have the required permissions to perform this action');
    }

    return true;
  }
}
