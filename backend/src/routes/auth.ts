import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { authenticateToken, tokenBlacklist, AuthRequest, requireRole } from '../middleware/auth';
import { validatePasswordStrength } from '../middleware/validate';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    if (process.env.AUTH_MODE === 'oidc' || process.env.NODE_ENV === 'production') return res.status(403).json({ success: false, message: 'Local login is disabled; use the configured identity provider' });
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() }
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret not configured'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
      jwtSecret,
      { expiresIn: '1h', issuer: 'ai-business-automation', audience: 'procurement-api' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        organization: user.organization
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    if (process.env.AUTH_MODE === 'oidc' || process.env.NODE_ENV === 'production') return res.status(403).json({ success: false, message: 'Local registration is disabled; use the configured identity provider' });
    const { email, password, firstName, lastName, organization } = req.body;

    if (!email || !password || typeof organization !== 'string' || organization.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and organization are required'
      });
    }

    // Validate password strength
    const pwCheck = validatePasswordStrength(password);
    if (!pwCheck.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: pwCheck.errors
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Public registration provisions an isolated tenant and its owner. Joining an
    // existing tenant is intentionally a separate administrator-controlled flow.
    const newUser = await prisma.$transaction(async tx => {
      const tenant = await tx.tenant.create({ data: { name: organization.trim() } });
      return tx.user.create({
        data: {
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          role: 'ADMIN',
          firstName: firstName || 'User',
          lastName: lastName || 'User',
          organization: organization.trim(),
          tenantId: tenant.id,
          verificationToken
        }
      });
    });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret not configured'
      });
    }

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, tenantId: newUser.tenantId },
      jwtSecret,
      { expiresIn: '1h', issuer: 'ai-business-automation', audience: 'procurement-api' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        tenantId: newUser.tenantId,
        organization: newUser.organization
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Logout route
router.post('/logout', authenticateToken, (req: AuthRequest, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    tokenBlacklist.add(token);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        organization: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { firstName, lastName, department } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(department !== undefined && { department })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        organization: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/users', authenticateToken, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { email, password, firstName, lastName, role = 'USER', oidcSubject } = req.body;
    const allowedRoles = ['ADMIN', 'USER', 'PROCUREMENT_MANAGER', 'EVALUATOR', 'COMPLIANCE_OFFICER'];
    const oidcMode = process.env.AUTH_MODE === 'oidc';
    if (!email || (!oidcMode && !password) || !allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Valid email, identity credential, and role are required' });
    }
    const generatedPassword = password || crypto.randomBytes(32).toString('hex');
    const pwCheck = validatePasswordStrength(generatedPassword);
    if (!pwCheck.valid) return res.status(400).json({ success: false, message: 'Password does not meet requirements', errors: pwCheck.errors });
    const owner = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { tenant: true } });
    if (!owner || owner.tenantId !== req.user!.tenantId) return res.status(403).json({ success: false, message: 'Tenant identity mismatch' });
    const user = await prisma.user.create({
      data: {
        email: String(email).trim().toLowerCase(), password: await bcrypt.hash(generatedPassword, 12),
        firstName: firstName || 'User', lastName: lastName || 'User', role,
        tenantId: owner.tenantId, organization: owner.tenant.name, oidcSubject: oidcSubject || null,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, tenantId: true },
    });
    return res.status(201).json({ success: true, user });
  } catch (error) {
    return res.status(409).json({ success: false, message: 'Unable to provision tenant user' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const pwCheck = validatePasswordStrength(newPassword);
    if (!pwCheck.valid) {
      return res.status(400).json({
        success: false,
        message: 'New password does not meet requirements',
        errors: pwCheck.errors
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Forgot password - request reset token
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry }
    });

    // In production: send email with link like `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`
    // Never expose the token in the response body
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);
    }
    return res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    const pwCheck = validatePasswordStrength(newPassword);
    if (!pwCheck.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: pwCheck.errors
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null
      }
    });

    return res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Resend verification email
router.post('/resend-verification', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken }
    });

    // In production: send email with link like `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Email verification token for user ${user.id}: ${verificationToken}`);
    }
    return res.json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
