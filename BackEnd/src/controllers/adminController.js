
import prisma from "../../lib/prisma.js";

export const getAllContacts = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

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
        animatorName: c.animators?.users_animators_user_idTousers?.full_name || null,
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
