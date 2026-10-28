const express = require('express');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { sendTokenResponse } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many login attempts. Please try again later.',
  },
});

const signupUser = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new AppError('Name, email and password are required.', 400));
  }

  const user = await User.create({ name, email, password });
  sendTokenResponse(user, 201, res);
});

const loginUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required.', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  sendTokenResponse(user, 200, res);
});

const googleLogin = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

const googleCallback = catchAsync(async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return next(new AppError('Google authentication failed.', 401));
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'development-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const redirectURL = process.env.CLIENT_URL || '/';
  res.redirect(redirectURL);
});

router.post('/signup', authLimiter, signupUser);
router.post('/login', authLimiter, loginUser);
router.get('/google', googleLogin);
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL || '/'}?auth=failed`,
    session: false,
  }),
  googleCallback
);

module.exports = router;
