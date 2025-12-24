import prisma from "../../lib/prisma.js";

export const getActiveQuestions = async (req, res) => {
  try {
    const questions = await prisma.questions.findMany({
      where: { is_active: true },
      orderBy: { created_at: "asc" },
      select: {
        id: true,
        question_text: true,
        options: true,
      },
    });

    return res.json({ questions });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT_NAME;
    const payload = { error: "Failed to fetch questions" };
    if (!isProduction) {
      payload.details = error?.message;
      payload.code = error?.code;
      payload.meta = error?.meta;
    }
    return res.status(500).json(payload);
  }
};
