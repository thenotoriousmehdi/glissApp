
import prisma from "../../lib/prisma.js";

export const listChefAnimators = async (req, res) => {
  try {
    const chefId = req.user?.userId;

    if (!chefId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const chef = await prisma.users.findUnique({ where: { id: chefId } });
    if (!chef || chef.role !== "chef") {
      return res
        .status(403)
        .json({ error: "Unauthorized: Chef access required" });
    }

    const animators = await prisma.animators.findMany({
      where: { chef_id: chefId },
      select: {
        id: true,
        users_animators_user_idTousers: {
          select: { full_name: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      animators: animators.map((a) => ({
        id: a.id,
        fullName: a.users_animators_user_idTousers?.full_name || "N/A",
      })),
    });
  } catch (error) {
    console.error("Error listing chef animators:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to list animators",
    });
  }
};

export const getChefDashboardStats = async (req, res) => {
  try {
    const chefId = req.user?.userId;
    const { date } = req.query;

    if (!chefId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const chef = await prisma.users.findUnique({ where: { id: chefId } });
    if (!chef || chef.role !== "chef") {
      return res
        .status(403)
        .json({ error: "Unauthorized: Chef access required" });
    }

    const dateFilter = {};
    if (date) {
      const selectedDate = new Date(String(date));
      if (Number.isNaN(selectedDate.getTime())) {
        return res.status(400).json({ error: "Invalid date" });
      }

      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);

      dateFilter.gte = selectedDate;
      dateFilter.lt = nextDay;
    }

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const animatorIds = await prisma.animators.findMany({
      where: { chef_id: chefId },
      select: { id: true },
    });

    const ids = animatorIds.map((a) => a.id);
    if (ids.length === 0) {
      return res.status(200).json({
        success: true,
        filters: { date: date || null },
        totals: {
          totalContacts: 0,
          totalSamplesGivenToContacts: 0,
          totalSamplesDistributedToAnimators: 0,
        },
      });
    }

    const contactsAgg = await prisma.contacts.aggregate({
      where: {
        animator_id: { in: ids },
        ...(hasDateFilter ? { submitted_at: dateFilter } : {}),
      },
      _count: { _all: true },
      _sum: { samples_given: true },
    });

    const inventoryAgg = await prisma.inventory.aggregate({
      where: {
        chef_id: chefId,
        animator_id: { in: ids },
        ...(hasDateFilter ? { created_at: dateFilter } : {}),
      },
      _sum: { quantity: true },
    });

    return res.status(200).json({
      success: true,
      filters: { date: date || null },
      totals: {
        totalContacts: contactsAgg._count?._all || 0,
        totalSamplesGivenToContacts: contactsAgg._sum?.samples_given || 0,
        totalSamplesDistributedToAnimators: inventoryAgg._sum?.quantity || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching chef dashboard stats:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard statistics",
    });
  }
};

export const getAnimatorsStats = async (req, res) => {
  try {
    const chefId = req.user?.userId;

    const { date } = req.query;

    if (!chefId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const chef = await prisma.users.findUnique({ where: { id: chefId } });
    if (!chef || chef.role !== "chef") {
      return res
        .status(403)
        .json({ error: "Unauthorized: Chef access required" });
    }

    const dateFilter = {};
    if (date) {
      const selectedDate = new Date(String(date));
      if (Number.isNaN(selectedDate.getTime())) {
        return res.status(400).json({ error: "Invalid date" });
      }

      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);

      dateFilter.gte = selectedDate;
      dateFilter.lt = nextDay;
    }

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    const animators = await prisma.animators.findMany({
      where: {
        chef_id: chefId,
      },
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
          where: hasDateFilter
            ? { chef_id: chefId, created_at: dateFilter }
            : { chef_id: chefId },
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
        phoneNumber: animator.users_animators_user_idTousers?.phone_number || null,
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

export const createInventoryEntry = async (req, res) => {
  try {
    const chefId = req.user?.userId;
    const { animator_id, quantity } = req.body;

    if (!chefId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const chef = await prisma.users.findUnique({ where: { id: chefId } });
    if (!chef || chef.role !== "chef") {
      return res
        .status(403)
        .json({ error: "Unauthorized: Chef access required" });
    }

    if (!animator_id || typeof animator_id !== "string") {
      return res.status(400).json({ error: "animator_id is required" });
    }

    const parsedQuantity =
      typeof quantity === "number" ? quantity : Number.parseInt(quantity, 10);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return res
        .status(400)
        .json({ error: "quantity must be a positive integer" });
    }

 

    const animator = await prisma.animators.findFirst({
      where: {
        id: animator_id,
        chef_id: chefId,
      },
      select: {
        id: true,
      },
    });

    if (!animator) {
      return res
        .status(404)
        .json({ error: "Animator not found for this chef" });
    }

    const entry = await prisma.inventory.create({
      data: {
        animator_id: animator.id,
        chef_id: chefId,
        quantity: parsedQuantity,
      },
      select: {
        id: true,
        animator_id: true,
        chef_id: true,
        quantity: true,
        created_at: true,
      },
    });

    return res.status(201).json({ success: true, entry });
  } catch (error) {
    console.error("Error creating inventory entry:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create inventory entry",
    });
  }
};
