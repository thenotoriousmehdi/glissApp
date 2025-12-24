import prisma from "../../lib/prisma.js";

export const submitContactWithAnswers = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone_number,
      address,
      commune,
      wilaya,
      activation_sector,
      samples_given,
      answers,
    } = req.body;

    if (!req.user?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!first_name || !last_name || !phone_number || !address || !commune || !wilaya || !activation_sector) {
      return res.status(400).json({ error: "Missing required contact fields" });
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "Answers must be a non-empty array" });
    }

    const invalidAnswer = answers.find(
      (a) => !a || typeof a !== "object" || !a.question_id || typeof a.selected_option !== "string"
    );
    if (invalidAnswer) {
      return res.status(400).json({ error: "Each answer must have question_id and selected_option" });
    }

    const animator = await prisma.animators.findFirst({ where: { user_id: req.user.userId } });
    if (!animator) {
      return res.status(403).json({ error: "No animator profile linked to this user" });
    }

    const questionIds = [...new Set(answers.map((a) => a.question_id))];
    const existingQuestions = await prisma.questions.findMany({
      where: { id: { in: questionIds } },
      select: { id: true },
    });

    if (existingQuestions.length !== questionIds.length) {
      return res.status(400).json({ error: "One or more question_id values are invalid" });
    }

    const createdContact = await prisma.$transaction(async (tx) => {
      const contact = await tx.contacts.create({
        data: {
          animator_id: animator.id,
          first_name,
          last_name,
          phone_number,
          address,
          commune,
          wilaya,
          activation_sector,
          samples_given: typeof samples_given === "number" ? samples_given : undefined,
        },
      });

      await tx.answers.createMany({
        data: answers.map((a) => ({
          contact_id: contact.id,
          question_id: a.question_id,
          selected_option: a.selected_option,
        })),
      });

      return tx.contacts.findUnique({
        where: { id: contact.id },
        include: { answers: true },
      });
    });

    return res.status(201).json({ contact: createdContact });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT_NAME;
    const payload = { error: "Failed to submit contact" };
    if (!isProduction) {
      payload.details = error?.message;
      payload.code = error?.code;
      payload.meta = error?.meta;
    }
    return res.status(500).json(payload);
  }
};