import prisma from "../../lib/prisma.js";

const requireAdmin = async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Unauthorized: Admin access required" });
    return null;
  }

  return user;
};

const buildDateFilter = (date) => {
  const dateFilter = {};
  if (!date) return { dateFilter, hasDateFilter: false };

  const selectedDate = new Date(String(date));
  if (Number.isNaN(selectedDate.getTime())) {
    return { error: "Invalid date" };
  }

  const nextDay = new Date(selectedDate);
  nextDay.setDate(nextDay.getDate() + 1);

  dateFilter.gte = selectedDate;
  dateFilter.lt = nextDay;

  return { dateFilter, hasDateFilter: true };
};

const buildContactWhere = ({ wilaya, commune, sector, date }) => {
  const where = {};
  if (wilaya) where.wilaya = String(wilaya);
  if (commune) where.commune = String(commune);
  if (sector) where.activation_sector = String(sector);

  const dateRes = buildDateFilter(date);
  if (dateRes?.error) return { error: dateRes.error };
  if (dateRes.hasDateFilter) where.submitted_at = dateRes.dateFilter;

  return { where };
};

export const getAllContacts = async (req, res) => {
  try {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const contacts = await prisma.contacts.findMany({
      orderBy: { submitted_at: "desc" },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        address: true,
        commune: true,
        wilaya: true,
        activation_sector: true,
        samples_given: true,
        submitted_at: true,
        animators: {
          select: {
            id: true,
            binome_code: true,
            users_animators_user_idTousers: {
              select: { full_name: true },
            },
            supervisors: {
              select: { full_name: true },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      contacts: contacts.map((c) => ({
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        phoneNumber: c.phone_number,
        address: c.address,
        commune: c.commune,
        wilaya: c.wilaya,
        activationSector: c.activation_sector,
        samplesGiven: c.samples_given,
        submittedAt: c.submitted_at,
        animatorId: c.animators?.id || null,
        animatorName:
          c.animators?.users_animators_user_idTousers?.full_name || null,
        animatorBinomeCode: c.animators?.binome_code || null,
        supervisorName: c.animators?.supervisors?.full_name || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch contacts",
    });
  }
};

export const getAnimatorsStats = async (req, res) => {
  try {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { date } = req.query;

    const dateRes = buildDateFilter(date);
    if (dateRes?.error) {
      return res.status(400).json({ error: dateRes.error });
    }

    const { dateFilter, hasDateFilter } = dateRes;

    const animators = await prisma.animators.findMany({
      include: {
        users_animators_user_idTousers: {
          select: {
            full_name: true,
            phone_number: true,
          },
        },
        supervisors: {
          select: {
            full_name: true,
          },
        },
        contacts: {
          where: hasDateFilter ? { submitted_at: dateFilter } : undefined,
          select: {
            id: true,
            samples_given: true,
          },
        },
        inventory: {
          where: hasDateFilter ? { created_at: dateFilter } : undefined,
          select: {
            quantity: true,
          },
        },
      },
    });

    const stats = animators.map((animator) => {
      const totalContacts = animator.contacts.length;

      const totalSamplesGiven = animator.contacts.reduce(
        (sum, contact) => sum + (contact.samples_given || 0),
        0
      );

      const totalSamplesReceived = animator.inventory.reduce(
        (sum, inv) => sum + (inv.quantity || 0),
        0
      );

      const samplesLeft = totalSamplesReceived - totalSamplesGiven;

      return {
        id: animator.id,
        fullName: animator.users_animators_user_idTousers?.full_name || "N/A",
        phoneNumber:
          animator.users_animators_user_idTousers?.phone_number || null,
        supervisorName: animator.supervisors?.full_name || null,
        binomeCode: animator.binome_code,
        totalContacts,
        totalSamplesGiven,
        totalSamplesReceived,
        samplesLeft,
      };
    });

    stats.sort((a, b) => b.totalContacts - a.totalContacts);

    return res.status(200).json({
      success: true,
      data: stats,
      filters: {
        date: date || null,
      },
    });
  } catch (error) {
    console.error("Error fetching animator stats:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch animator statistics",
    });
  }
};

export const getDashboardFilters = async (req, res) => {
  try {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { wilaya } = req.query;

    const wilayaRows = await prisma.contacts.findMany({
      distinct: ["wilaya"],
      select: { wilaya: true },
      orderBy: { wilaya: "asc" },
    });

    const sectorRows = await prisma.contacts.findMany({
      distinct: ["activation_sector"],
      select: { activation_sector: true },
      orderBy: { activation_sector: "asc" },
    });

    const communeRows = await prisma.contacts.findMany({
      where: wilaya ? { wilaya: String(wilaya) } : undefined,
      distinct: ["commune"],
      select: { commune: true },
      orderBy: { commune: "asc" },
    });

    return res.status(200).json({
      success: true,
      options: {
        wilayas: wilayaRows.map((r) => r.wilaya).filter(Boolean),
        communes: communeRows.map((r) => r.commune).filter(Boolean),
        sectors: sectorRows.map((r) => r.activation_sector).filter(Boolean),
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard filters:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard filters",
    });
  }
};

export const getDashboardSummary = async (req, res) => {
  try {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { wilaya, commune, sector, date } = req.query;
    const whereRes = buildContactWhere({ wilaya, commune, sector, date });
    if (whereRes?.error) {
      return res.status(400).json({ error: whereRes.error });
    }

    const { where } = whereRes;

    const contactsAgg = await prisma.contacts.aggregate({
      where,
      _count: { _all: true },
      _sum: { samples_given: true },
    });

    const sectorGroups = await prisma.contacts.groupBy({
      by: ["activation_sector"],
      where,
      _count: { _all: true },
    });

    const totalContacts = contactsAgg._count?._all || 0;
    const sectorBreakdown = sectorGroups
      .map((g) => {
        const count = g._count?._all || 0;
        return {
          sector: g.activation_sector || "N/A",
          count,
          percentage: totalContacts > 0 ? (count / totalContacts) * 100 : 0,
        };
      })
      .sort((a, b) => b.count - a.count);

    return res.status(200).json({
      success: true,
      filters: {
        wilaya: wilaya || null,
        commune: commune || null,
        sector: sector || null,
        date: date || null,
      },
      totals: {
        totalContacts,
        totalSamplesGivenToContacts: contactsAgg._sum?.samples_given || 0,
      },
      sectorBreakdown,
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard summary",
    });
  }
};

export const getDashboardQuestionsBreakdown = async (req, res) => {
  try {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { wilaya, commune, sector, date } = req.query;
    const whereRes = buildContactWhere({ wilaya, commune, sector, date });
    if (whereRes?.error) {
      return res.status(400).json({ error: whereRes.error });
    }

    const { where } = whereRes;

    const questions = await prisma.questions.findMany({
      orderBy: { created_at: "asc" },
      select: { id: true, question_text: true },
    });

    const grouped = await prisma.answers.groupBy({
      by: ["question_id", "selected_option"],
      where: {
        contacts: where,
      },
      _count: { _all: true },
    });

    const byQuestion = new Map();
    for (const g of grouped) {
      const qid = g.question_id || "";
      if (!byQuestion.has(qid)) byQuestion.set(qid, []);
      byQuestion.get(qid).push({
        option: g.selected_option,
        count: g._count?._all || 0,
      });
    }

    const result = questions.map((q) => {
      const items = byQuestion.get(q.id) || [];
      const total = items.reduce((sum, i) => sum + (i.count || 0), 0);
      const options = items
        .map((i) => ({
          option: i.option,
          count: i.count,
          percentage: total > 0 ? (i.count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      return {
        id: q.id,
        questionText: q.question_text,
        totalAnswers: total,
        options,
      };
    });

    return res.status(200).json({
      success: true,
      filters: {
        wilaya: wilaya || null,
        commune: commune || null,
        sector: sector || null,
        date: date || null,
      },
      questions: result,
    });
  } catch (error) {
    console.error("Error fetching questions breakdown:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch questions breakdown",
    });
  }
};
