jest.mock('../../src/config/prisma');

const prisma = require('../../src/config/prisma');
const projectsService = require('../../src/modules/projects/projects.service');

const owner = { id: 'user-1', role: 'USER' };
const admin = { id: 'admin-1', role: 'ADMIN' };

describe('listProjects', () => {
  it('scopes to the caller for a USER', async () => {
    prisma.project.findMany.mockResolvedValue([]);
    prisma.project.count.mockResolvedValue(0);

    await projectsService.listProjects(owner);

    expect(prisma.project.findMany).toHaveBeenCalledWith({
      where: { ownerId: owner.id },
      orderBy: { createdAt: 'asc' },
      skip: undefined,
      take: undefined,
    });
    expect(prisma.project.count).toHaveBeenCalledWith({ where: { ownerId: owner.id } });
  });

  it('sees everything for an ADMIN', async () => {
    prisma.project.findMany.mockResolvedValue([]);
    prisma.project.count.mockResolvedValue(0);

    await projectsService.listProjects(admin);

    expect(prisma.project.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'asc' },
      skip: undefined,
      take: undefined,
    });
  });

  it('applies pagination when provided and returns items + count', async () => {
    const items = [{ id: 'project-1' }];
    prisma.project.findMany.mockResolvedValue(items);
    prisma.project.count.mockResolvedValue(5);

    const result = await projectsService.listProjects(owner, { skip: 20, take: 20 });

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 }),
    );
    expect(result).toEqual({ items, count: 5 });
  });
});

describe('getProjectById', () => {
  it('throws 404 when the project does not exist', async () => {
    prisma.project.findUnique.mockResolvedValue(null);

    await expect(projectsService.getProjectById(owner, 'missing')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('throws 403 for a non-owner, non-admin', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', ownerId: 'someone-else' });

    await expect(projectsService.getProjectById(owner, 'project-1')).rejects.toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  });

  it('returns the project for its owner', async () => {
    const project = { id: 'project-1', ownerId: owner.id };
    prisma.project.findUnique.mockResolvedValue(project);

    await expect(projectsService.getProjectById(owner, 'project-1')).resolves.toBe(project);
  });

  it('returns the project for an admin who is not the owner', async () => {
    const project = { id: 'project-1', ownerId: 'someone-else' };
    prisma.project.findUnique.mockResolvedValue(project);

    await expect(projectsService.getProjectById(admin, 'project-1')).resolves.toBe(project);
  });
});

describe('createProject', () => {
  it('creates the project owned by the caller', async () => {
    const created = { id: 'project-1', name: 'My Board', ownerId: owner.id };
    prisma.project.create.mockResolvedValue(created);

    const result = await projectsService.createProject(owner, { name: 'My Board' });

    expect(prisma.project.create).toHaveBeenCalledWith({ data: { name: 'My Board', ownerId: owner.id } });
    expect(result).toBe(created);
  });
});

describe('updateProject', () => {
  it('checks access before renaming', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', ownerId: 'someone-else' });

    await expect(projectsService.updateProject(owner, 'project-1', { name: 'x' })).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(prisma.project.update).not.toHaveBeenCalled();
  });

  it('renames the project once access is confirmed', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', ownerId: owner.id });
    const updated = { id: 'project-1', name: 'Renamed' };
    prisma.project.update.mockResolvedValue(updated);

    const result = await projectsService.updateProject(owner, 'project-1', { name: 'Renamed' });

    expect(prisma.project.update).toHaveBeenCalledWith({ where: { id: 'project-1' }, data: { name: 'Renamed' } });
    expect(result).toBe(updated);
  });
});

describe('deleteProject', () => {
  it('checks access before deleting', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', ownerId: 'someone-else' });

    await expect(projectsService.deleteProject(owner, 'project-1')).rejects.toMatchObject({ statusCode: 403 });
    expect(prisma.project.delete).not.toHaveBeenCalled();
  });

  it('deletes the project and returns it once access is confirmed', async () => {
    const existing = { id: 'project-1', ownerId: owner.id };
    prisma.project.findUnique.mockResolvedValue(existing);

    const result = await projectsService.deleteProject(owner, 'project-1');

    expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: 'project-1' } });
    expect(result).toBe(existing);
  });
});

describe('assertProjectAccess', () => {
  it('resolves silently when the caller has access', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', ownerId: owner.id });

    await expect(projectsService.assertProjectAccess(owner, 'project-1')).resolves.toBeUndefined();
  });

  it('throws the same error getProjectById would for a missing project', async () => {
    prisma.project.findUnique.mockResolvedValue(null);

    await expect(projectsService.assertProjectAccess(owner, 'missing')).rejects.toMatchObject({ statusCode: 404 });
  });
});
