jest.mock('socket.io');
jest.mock('jsonwebtoken');

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { initSockets, emitTaskEvent } = require('../../src/sockets');

describe('emitTaskEvent before initSockets has run', () => {
  it('is a no-op on a fresh module instance', () => {
    jest.isolateModules(() => {
      const fresh = require('../../src/sockets');
      expect(() => fresh.emitTaskEvent('task:created', { ownerId: 'user-1' })).not.toThrow();
    });
  });
});

describe('initSockets', () => {
  let fakeIo;
  let useHandler;
  let connectionHandler;

  beforeEach(() => {
    fakeIo = {
      use: jest.fn((handler) => {
        useHandler = handler;
      }),
      on: jest.fn((event, handler) => {
        if (event === 'connection') connectionHandler = handler;
      }),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    Server.mockImplementation(() => fakeIo);
  });

  it('constructs a socket.io Server with permissive CORS', () => {
    const httpServer = {};
    initSockets(httpServer);

    expect(Server).toHaveBeenCalledWith(httpServer, { cors: { origin: '*' } });
  });

  describe('connection auth middleware', () => {
    it('rejects a connection with no token', () => {
      initSockets({});
      const next = jest.fn();

      useHandler({ handshake: { auth: {} } }, next);

      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toMatch(/token required/i);
    });

    it('rejects an invalid or expired token', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('bad signature');
      });
      initSockets({});
      const next = jest.fn();

      useHandler({ handshake: { auth: { token: 'bad-token' } } }, next);

      expect(next.mock.calls[0][0].message).toMatch(/invalid or expired/i);
    });

    it('attaches socket.data.user and calls next with no error for a valid token', () => {
      jwt.verify.mockReturnValue({ sub: 'user-1', role: 'USER' });
      initSockets({});
      const next = jest.fn();
      const socket = { handshake: { auth: { token: 'good-token' } }, data: {} };

      useHandler(socket, next);

      expect(socket.data.user).toEqual({ id: 'user-1', role: 'USER' });
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('connection handler', () => {
    it('joins the per-user room, and the admins room for an admin', () => {
      initSockets({});
      const socket = { data: { user: { id: 'user-1', role: 'ADMIN' } }, join: jest.fn() };

      connectionHandler(socket);

      expect(socket.join).toHaveBeenCalledWith('user:user-1');
      expect(socket.join).toHaveBeenCalledWith('admins');
    });

    it('does not join the admins room for a regular user', () => {
      initSockets({});
      const socket = { data: { user: { id: 'user-1', role: 'USER' } }, join: jest.fn() };

      connectionHandler(socket);

      expect(socket.join).toHaveBeenCalledWith('user:user-1');
      expect(socket.join).not.toHaveBeenCalledWith('admins');
    });
  });

  describe('emitTaskEvent', () => {
    it('emits to the task owner room and the admins room', () => {
      initSockets({});

      emitTaskEvent('task:created', { ownerId: 'user-1' });

      expect(fakeIo.to).toHaveBeenCalledWith('user:user-1');
      expect(fakeIo.to).toHaveBeenCalledWith('admins');
      expect(fakeIo.emit).toHaveBeenCalledWith('task:created', { ownerId: 'user-1' });
    });
  });
});
