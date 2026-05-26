const userRepository = require('../repositories/userRepository');
const subscriptionRepository = require('../repositories/subscriptionRepository');
const { generateToken } = require('../middleware/auth');

const authController = {
  // Register new user
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Check if user exists
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Get role ID
      let roleData = await userRepository.getRoleByName(role || 'student');
      if (!roleData) {
        roleData = await userRepository.getRoleByName('student');
      }

      // Create user
      const userId = await userRepository.create({
        email,
        password,
        firstName: firstName || '',
        lastName: lastName || '',
        roleId: roleData.ROLE_ID
      });

      // Get created user
      const user = await userRepository.findById(userId);

      // Generate token
      const token = generateToken(user);

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user.USER_ID,
          email: user.EMAIL,
          firstName: user.FIRST_NAME,
          lastName: user.LAST_NAME,
          role: user.ROLE_NAME
        },
        token
      });
    } catch (error) {
      next(error);
    }
  },

  // Login user
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValid = await userRepository.verifyPassword(password, user.PASSWORD_HASH);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check if active
      if (!user.IS_ACTIVE) {
        return res.status(403).json({ error: 'Account is deactivated. Contact support.' });
      }

      // Get subscription
      const subscription = await subscriptionRepository.getUserSubscription(user.USER_ID);

      // Generate token
      const token = generateToken(user);

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.json({
        message: 'Login successful',
        user: {
          id: user.USER_ID,
          email: user.EMAIL,
          firstName: user.FIRST_NAME,
          lastName: user.LAST_NAME,
          role: user.ROLE_NAME
        },
        subscription: subscription ? {
          plan: subscription.PLAN_NAME,
          tokensRemaining: subscription.TOKENS_REMAINING,
          expiresAt: subscription.END_DATE
        } : null,
        token
      });
    } catch (error) {
      next(error);
    }
  },

  // Logout
  async logout(req, res) {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  },

  // Check if admin exists
  async adminExists(req, res, next) {
    try {
      const exists = await userRepository.adminExists();
      res.json({ exists });
    } catch (error) {
      next(error);
    }
  },

  // Get current user
  async getCurrentUser(req, res, next) {
    try {
      const user = await userRepository.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const subscription = await subscriptionRepository.getUserSubscription(user.USER_ID);

      res.json({
        user: {
          id: user.USER_ID,
          email: user.EMAIL,
          firstName: user.FIRST_NAME,
          lastName: user.LAST_NAME,
          role: user.ROLE_NAME,
          isActive: user.IS_ACTIVE,
          createdAt: user.CREATED_AT
        },
        subscription: subscription ? {
          plan: subscription.PLAN_NAME,
          tokensRemaining: subscription.TOKENS_REMAINING,
          expiresAt: subscription.END_DATE
        } : null
      });
    } catch (error) {
      next(error);
    }
  },

  // Update profile
  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, email } = req.body;

      await userRepository.update(req.user.id, { firstName, lastName, email });

      const user = await userRepository.findById(req.user.id);

      res.json({
        message: 'Profile updated',
        user: {
          id: user.USER_ID,
          email: user.EMAIL,
          firstName: user.FIRST_NAME,
          lastName: user.LAST_NAME,
          role: user.ROLE_NAME
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Change password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
      }

      const user = await userRepository.findById(req.user.id);
      const isValid = await userRepository.verifyPassword(currentPassword, user.PASSWORD_HASH);

      if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      await userRepository.changePassword(req.user.id, newPassword);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;