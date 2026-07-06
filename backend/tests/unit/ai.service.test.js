jest.mock('../../src/config/openai');
jest.mock('../../src/modules/ai/ai.tools', () => ({
  TOOL_DEFINITIONS: [],
  TOOL_HANDLERS: {
    search_tasks: jest.fn(),
    create_task: jest.fn(),
    update_task: jest.fn(),
    delete_task: jest.fn(),
    list_projects: jest.fn(),
  },
}));

const openaiMock = require('../../src/config/openai');
const { TOOL_HANDLERS } = require('../../src/modules/ai/ai.tools');
const aiService = require('../../src/modules/ai/ai.service');

const owner = { id: 'user-1', role: 'USER' };
const TASK_ID = '22222222-2222-2222-2222-222222222222';

function toolCallResponse(name, args, id = 'call_1') {
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [{ id, type: 'function', function: { name, arguments: JSON.stringify(args) } }],
        },
      },
    ],
  };
}

function finalResponse(content) {
  return { choices: [{ message: { role: 'assistant', content, tool_calls: undefined } }] };
}

afterEach(() => {
  Object.values(TOOL_HANDLERS).forEach((fn) => fn.mockReset());
});

describe('chat', () => {
  it('runs a tool call then returns the final reply with mutated=false, pendingDelete=null', async () => {
    TOOL_HANDLERS.search_tasks.mockResolvedValue({ count: 2, tasks: [] });
    openaiMock.chat.completions.create
      .mockResolvedValueOnce(toolCallResponse('search_tasks', { status: 'TODO' }))
      .mockResolvedValueOnce(finalResponse('You have 2 TODO tasks.'));

    const result = await aiService.chat(owner, 'show my todo tasks');

    expect(result).toEqual({ reply: 'You have 2 TODO tasks.', pendingDelete: null, mutated: false });
    expect(TOOL_HANDLERS.search_tasks).toHaveBeenCalledWith(owner, { status: 'TODO' });
  });

  it('marks mutated=true when a create/update tool ran', async () => {
    TOOL_HANDLERS.create_task.mockResolvedValue({ task: { id: 'task-1' }, mutated: true });
    openaiMock.chat.completions.create
      .mockResolvedValueOnce(toolCallResponse('create_task', { title: 'x', dueDate: '2026-12-31', projectId: 'p-1' }))
      .mockResolvedValueOnce(finalResponse('Created it.'));

    const result = await aiService.chat(owner, 'create a task');

    expect(result.mutated).toBe(true);
  });

  it('surfaces a delete_task confirmation request as pendingDelete without deleting', async () => {
    TOOL_HANDLERS.delete_task.mockResolvedValue({ requiresConfirmation: true, taskId: TASK_ID, title: 'Old task' });
    openaiMock.chat.completions.create
      .mockResolvedValueOnce(toolCallResponse('delete_task', { taskId: TASK_ID }))
      .mockResolvedValueOnce(finalResponse('Please confirm you want to delete "Old task".'));

    const result = await aiService.chat(owner, 'delete that task');

    expect(result.pendingDelete).toEqual({ taskId: TASK_ID, title: 'Old task' });
    expect(result.mutated).toBe(false);
  });

  it('feeds a thrown ApiError back to the model as a tool error instead of failing the request', async () => {
    const { ApiError } = require('../../src/middleware/error.middleware');
    TOOL_HANDLERS.update_task.mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Task not found'));
    openaiMock.chat.completions.create
      .mockResolvedValueOnce(toolCallResponse('update_task', { taskId: TASK_ID, status: 'DONE' }))
      .mockResolvedValueOnce(finalResponse("I couldn't find that task."));

    const result = await aiService.chat(owner, 'mark that task done');

    expect(result.reply).toBe("I couldn't find that task.");
    const toolResultMessage = openaiMock.chat.completions.create.mock.calls[1][0].messages.find((m) => m.role === 'tool');
    expect(JSON.parse(toolResultMessage.content)).toEqual({ error: 'Task not found' });
  });

  it('returns a graceful fallback after exhausting the tool-call iteration cap', async () => {
    TOOL_HANDLERS.search_tasks.mockResolvedValue({ count: 0, tasks: [] });
    openaiMock.chat.completions.create.mockResolvedValue(toolCallResponse('search_tasks', {}));

    const result = await aiService.chat(owner, 'keep searching forever');

    expect(result.reply).toMatch(/wasn't able to finish/i);
    expect(openaiMock.chat.completions.create).toHaveBeenCalledTimes(5);
  });

  it('translates an OpenAI API error (e.g. rate limit / quota exceeded) into a clean 502 instead of a raw 500', async () => {
    const OpenAI = require('openai');
    const upstreamError = new OpenAI.APIError(
      429,
      { code: 'insufficient_quota', message: 'You exceeded your current quota' },
      'You exceeded your current quota',
      undefined,
    );
    openaiMock.chat.completions.create.mockRejectedValueOnce(upstreamError);

    await expect(aiService.chat(owner, 'hello')).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_PROVIDER_ERROR',
    });
  });

  it('throws a 503 AI_UNAVAILABLE error when no OpenAI client is configured', async () => {
    jest.resetModules();
    jest.doMock('../../src/config/openai', () => null);
    jest.doMock('../../src/modules/ai/ai.tools', () => ({ TOOL_DEFINITIONS: [], TOOL_HANDLERS: {} }));
    const freshAiService = require('../../src/modules/ai/ai.service');

    await expect(freshAiService.chat(owner, 'hello')).rejects.toMatchObject({
      statusCode: 503,
      code: 'AI_UNAVAILABLE',
    });
  });
});
