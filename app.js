const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const passport = require('passport');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const { configurePassport } = require('./config/passport');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(xss());
app.use(mongoSanitize());

configurePassport(passport);
app.use(passport.initialize());

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Task Manager API is running.',
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
