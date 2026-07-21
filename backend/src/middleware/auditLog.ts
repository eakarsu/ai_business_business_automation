import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from './auth';

const MUTATION_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

// Extract entity type and ID from URL path
// e.g. /api/vendors/abc123 -> { entityType: 'vendor', entityId: 'abc123' }
function parseEntity(path: string): { entityType: string; entityId: string | null } {
  const parts = path.replace(/^\/api\//, '').split('/').filter(Boolean);
  const entityType = parts[0] ?? 'unknown';
  // Second segment is typically the ID (skip 'export', 'pdf', 'csv' suffixes)
  const potentialId = parts[1];
  const nonIdSegments = new Set(['export', 'pdf', 'csv', 'stream', 'events']);
  const entityId = potentialId && !nonIdSegments.has(potentialId) ? potentialId : null;
  return { entityType, entityId };
}

function mapMethodToAction(method: string): string {
  switch (method) {
    case 'POST': return 'CREATE';
    case 'PATCH':
    case 'PUT': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    default: return method;
  }
}

export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!MUTATION_METHODS.has(req.method)) {
    next();
    return;
  }

  const authReq = req as AuthRequest;
  const originalJson = res.json.bind(res);
  const requestBody = req.body ? JSON.parse(JSON.stringify(req.body)) : null;

  // Override res.json to capture the response and write the audit log
  res.json = function (body: unknown) {
    const statusCode = res.statusCode;

    // Only log successful mutations (2xx responses)
    if (statusCode >= 200 && statusCode < 300 && authReq.user?.id) {
      const { entityType, entityId } = parseEntity(req.path);
      const action = mapMethodToAction(req.method);

      const resolvedEntityId =
        entityId ||
        (body && typeof body === 'object' && 'data' in (body as object) &&
          typeof (body as { data?: { id?: string } }).data?.id === 'string'
          ? (body as { data: { id: string } }).data.id
          : null) ||
        (body && typeof body === 'object' && 'id' in (body as object) &&
          typeof (body as { id?: string }).id === 'string'
          ? (body as { id: string }).id
          : 'unknown');

      prisma.auditLog.create({
        data: {
          userId: authReq.user.id,
          tenantId: authReq.user.tenantId,
          action,
          entityType,
          entityId: resolvedEntityId,
          oldValues: req.method === 'DELETE' ? requestBody : undefined,
          newValues: req.method !== 'DELETE' ? requestBody : undefined,
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || null,
          userAgent: req.headers['user-agent'] || null
        }
      }).catch(err => {
        // Non-fatal: log failure but don't block the response
        console.error('Audit log write failed:', err);
      });
    }

    return originalJson(body);
  };

  next();
}
