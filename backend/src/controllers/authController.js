const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Required attributes missing.' });

    const existing = await userRepository.findByEmail(email);
    if (existing) return res.status(409).json({ error: 'Account with this email already indexed.' });

    const hashed = await bcrypt.hash(password, 10);
    await userRepository.create({ email, passwordHash: hashed, role });

    res.status(201).json({ message: 'User registration completed successfully.' });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await userRepository.findByEmail(email);
    if (!user || user.ISACTIVE === 0) return res.status(401).json({ error: 'Invalid authentication credentials.' });

    // Handle Oracle returning properties upper-cased by default
    const valid = await bcrypt.compare(password, user.PASSWORDHASH);
    if (!valid) return res.status(401).json({ error: 'Invalid authentication credentials.' });

    const token = jwt.sign(
      { userId: user.USERID, email: user.EMAIL, role: user.ROLE },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, role: user.ROLE, email: user.EMAIL });
  } catch (err) { next(err); }
};

module.exports = { register, login };