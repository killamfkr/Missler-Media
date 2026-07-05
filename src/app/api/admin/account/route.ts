import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getStudioInfo, setSetting } from "@/lib/settings";

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  businessName: z.string().optional(),
  businessPhone: z.string().optional(),
  businessEmail: z.string().optional(),
  businessAddress: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function GET() {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;

  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      role: true,
    },
  });

  const studio = await getStudioInfo();

  return NextResponse.json({ user, studio });
}

export async function PATCH(request: Request) {
  const authResult = await requireApiAdmin();
  if ("error" in authResult) return authResult.error;

  const session = await auth();

  try {
    const body = await request.json();

    if (body.currentPassword && body.newPassword) {
      const passwords = passwordSchema.parse(body);
      const user = await prisma.user.findUnique({
        where: { id: session!.user!.id },
      });
      if (!user) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      const valid = await bcrypt.compare(passwords.currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(passwords.newPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      return NextResponse.json({ success: true, message: "Password updated." });
    }

    const data = profileSchema.parse(body);

    const existing = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: { id: session!.user!.id },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Email already in use." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session!.user!.id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        role: true,
      },
    });

    if (data.businessName !== undefined) {
      await setSetting("studio_name", data.businessName);
    }
    if (data.businessPhone !== undefined) {
      await setSetting("studio_phone", data.businessPhone);
    }
    if (data.businessEmail !== undefined) {
      await setSetting("studio_email", data.businessEmail);
    }
    if (data.businessAddress !== undefined) {
      await setSetting("studio_address", data.businessAddress);
    }

    const studio = await getStudioInfo();
    return NextResponse.json({ user, studio });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}
