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

  const { id: worldId } = await params;

  try {
    // Verify membership
    const membership = await prisma.worldMember.findUnique({
      where: {
        worldId_userId: {
          worldId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to view markers in this world.' },
        { status: 403 }
      );
    }

    const markers = await prisma.marker.findMany({
      where: { worldId },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ markers });
  } catch (error) {
    console.error('Error fetching markers:', error);
    return NextResponse.json({ error: 'Failed to fetch markers' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: worldId } = await params;

  try {
    // Verify membership
    const membership = await prisma.worldMember.findUnique({
      where: {
        worldId_userId: {
          worldId,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied. You are not a member of this world.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, lat, lng, imageUrl, isResolved } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Marker title is required' }, { status: 400 });
    }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Valid latitude and longitude are required' }, { status: 400 });
    }

    const resolved = Boolean(isResolved);

    const marker = await prisma.marker.create({
      data: {
        worldId,
        createdById: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        lat,
        lng,
        imageUrl: imageUrl || null,
        isResolved: resolved,
        resolvedAt: resolved ? new Date() : null,
        resolvedBy: resolved ? (user.name || user.email) : null,
      },
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

    return NextResponse.json({ marker }, { status: 201 });
  } catch (error) {
    console.error('Error creating marker:', error);
    return NextResponse.json({ error: 'Failed to create marker' }, { status: 500 });
  }
}
