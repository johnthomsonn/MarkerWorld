import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MW-${code}`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Only fetch worlds where user is either the owner or an invited member!
    const worlds = await prisma.world.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            markers: true,
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ worlds });
  } catch (error) {
    console.error('Error fetching worlds:', error);
    return NextResponse.json({ error: 'Failed to fetch worlds' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, description } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'World name is required' }, { status: 400 });
    }

    // Generate a unique invite code
    let inviteCode = generateInviteCode();
    let collisionCheck = await prisma.world.findUnique({ where: { inviteCode } });
    while (collisionCheck) {
      inviteCode = generateInviteCode();
      collisionCheck = await prisma.world.findUnique({ where: { inviteCode } });
    }

    const world = await prisma.world.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        inviteCode,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            markers: true,
            members: true,
          },
        },
      },
    });

    return NextResponse.json({ world }, { status: 201 });
  } catch (error) {
    console.error('Error creating world:', error);
    return NextResponse.json({ error: 'Failed to create world' }, { status: 500 });
  }
}
