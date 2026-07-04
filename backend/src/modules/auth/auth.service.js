const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/prisma');
const env = require('../../config/env');
const { ApiError } = require('../../middleware/error.middleware');

const SALT_ROUNDS = 10;

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiry,
  });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiry,
  });
}

function toPublicUser(user) {
  return { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt };
}

async function register({ email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new ApiError(409, 'CONFLICT', 'A user with this email already exists');
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, password: hashed, role: 'USER' },
  });

  return toPublicUser(user);
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid email or password');
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  return { user: toPublicUser(user), accessToken, refreshToken };
}

async function refresh({ refreshToken }) {
  let payload;

  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
  } catch (err) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });

  if (!user) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'User no longer exists');
  }

  const accessToken = signAccessToken(user);

  return { accessToken };
}

module.exports = { register, login, refresh, toPublicUser };
