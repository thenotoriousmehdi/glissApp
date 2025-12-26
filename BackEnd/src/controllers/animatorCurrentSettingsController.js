import prisma from "../../lib/prisma.js";

export const getCurrentSettings = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const animator = await prisma.animators.findFirst({
      where: { user_id: req.user.userId },
      select: { id: true },
    });

    if (!animator) {
      return res.status(403).json({ error: "No animator profile linked to this user" });
    }

    const settings = await prisma.animator_current_settings.findUnique({
      where: { animator_id: animator.id },
      select: {
        wilaya_code: true,
        wilaya_name: true,
        commune: true,
        activation_sector: true,
        updated_at: true,
      },
    });

    return res.status(200).json({ settings: settings || null });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT_NAME;
    const payload = { error: "Failed to get current settings" };
    if (!isProduction) {
      payload.details = error?.message;
      payload.code = error?.code;
      payload.meta = error?.meta;
    }
    return res.status(500).json(payload);
  }
};

export const patchCurrentSettings = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const animator = await prisma.animators.findFirst({
      where: { user_id: req.user.userId },
      select: { id: true },
    });

    if (!animator) {
      return res.status(403).json({ error: "No animator profile linked to this user" });
    }

    const { wilaya_code, wilaya_name, commune, activation_sector } = req.body || {};

    const existing = await prisma.animator_current_settings.findUnique({
      where: { animator_id: animator.id },
      select: {
        id: true,
        wilaya_code: true,
        wilaya_name: true,
        commune: true,
        activation_sector: true,
      },
    });

    if (!existing) {
      if (!wilaya_code || !wilaya_name || !commune || !activation_sector) {
        return res.status(400).json({
          error: "Current settings not initialized. Please provide wilaya_code, wilaya_name, commune, and activation_sector.",
        });
      }

      const created = await prisma.animator_current_settings.create({
        data: {
          animator_id: animator.id,
          wilaya_code: String(wilaya_code),
          wilaya_name: String(wilaya_name),
          commune: String(commune),
          activation_sector: String(activation_sector),
          updated_at: new Date(),
        },
        select: {
          wilaya_code: true,
          wilaya_name: true,
          commune: true,
          activation_sector: true,
          updated_at: true,
        },
      });

      return res.status(200).json({ settings: created });
    }

    const next = {
      wilaya_code: wilaya_code !== undefined ? String(wilaya_code) : existing.wilaya_code,
      wilaya_name: wilaya_name !== undefined ? String(wilaya_name) : existing.wilaya_name,
      commune: commune !== undefined ? String(commune) : existing.commune,
      activation_sector:
        activation_sector !== undefined ? String(activation_sector) : existing.activation_sector,
    };

    const updated = await prisma.animator_current_settings.update({
      where: { animator_id: animator.id },
      data: {
        ...next,
        updated_at: new Date(),
      },
      select: {
        wilaya_code: true,
        wilaya_name: true,
        commune: true,
        activation_sector: true,
        updated_at: true,
      },
    });

    return res.status(200).json({ settings: updated });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT_NAME;
    const payload = { error: "Failed to update current settings" };
    if (!isProduction) {
      payload.details = error?.message;
      payload.code = error?.code;
      payload.meta = error?.meta;
    }
    return res.status(500).json(payload);
  }
};
