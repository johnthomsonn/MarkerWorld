import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const marker = await prisma.marker.findUnique({
      where: { id },
      include: {
        world: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!marker) {
      return NextResponse.json({ error: 'Marker not found' }, { status: 404 });
    }

    const isMember = marker.world.members.some((m) => m.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const updateData: {
      title?: string;
      description?: string | null;
      imageUrl?: string | null;
      isResolved?: boolean;
      resolvedAt?: Date | null;
      resolvedBy?: string | null;
    } = {};

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;

    if (body.isResolved !== undefined) {
      const willBeResolved = Boolean(body.isResolved);
      updateData.isResolved = willBeResolved;
      if (willBeResolved && !marker.isResolved) {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = user.name || user.email;
      } else if (!willBeResolved) {
        updateData.resolvedAt = null;
        updateData.resolvedBy = null;
      }
    }

    const updated = await prisma.marker.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ marker: updated });
  } catch (error) {
    console.error('Error updating marker:', error);
    return NextResponse.json({ error: 'Failed to update marker' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const marker = await prisma.marker.findUnique({
      where: { id },
      include: {
        world: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!marker) {
      return NextResponse.json({ error: 'Marker not found' }, { status: 404 });
    }

    const isMember = marker.world.members.some((m) => m.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await prisma.marker.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting marker:', error);
    return NextResponse.json({ error: 'Failed to delete marker' }, { status: 500 });
  }
}
