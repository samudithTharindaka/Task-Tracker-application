const { z } = require('zod');
const aiService = require('./ai.service');

const chatSchema = z.object({
  message: z.string().min(1, 'message is required'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .max(20)
    .optional(),
  projectId: z.string().uuid('Invalid project id').optional(),
});

async function chat(req, res, next) {
  try {
    const { message, history, projectId } = chatSchema.parse(req.body);
    const result = await aiService.chat(req.user, message, history ?? [], projectId ?? null);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { chat };
