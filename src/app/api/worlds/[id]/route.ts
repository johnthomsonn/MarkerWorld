import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const world = await prisma.world.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { markers: true, members: true },
        },
      },
    });

    if (!world) {
      return NextResponse.json({ error: 'World not found' }, { status: 404 });
    }

    // Strict isolation check: User must be a member
    const isMember = world.members.some((m) => m.userId === user.id);
    if (!isMember && world.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied. You are not a member of this world.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ world });
  } catch (error) {
    console.error('Error fetching world:', error);
    return NextResponse.json({ error: 'Failed to fetch world' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const world = await prisma.world.findUnique({ where: { id } });
    if (!world) {
      return NextResponse.json({ error: 'World not found' }, { status: 404 });
    }

    if (world.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the world creator can edit this world' }, { status: 403 });
    }

    const { name, description } = await req.json();

    const updated = await prisma.world.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : world.name,
        description: description !== undefined ? description?.trim() : world.description,
      },
    });

    return NextResponse.json({ world: updated });
  } catch (error) {
    console.error('Error updating world:', error);
    return NextResponse.json({ error: 'Failed to update world' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const world = await prisma.world.findUnique({ where: { id } });
    if (!world) {
      return NextResponse.json({ error: 'World not found' }, { status: 404 });
    }

    if (world.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the world creator can delete this world' }, { status: 403 });
    }

    await prisma.world.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting world:', error);
    return NextResponse.json({ error: 'Failed to delete world' }, { status: 500 });
  }
}
