import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to join a world' }, { status: 401 });
  }

  try {
    const { inviteCode } = await req.json();

    if (!inviteCode || !inviteCode.trim()) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    const code = inviteCode.trim().toUpperCase();

    const world = await prisma.world.findUnique({
      where: { inviteCode: code },
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

    if (!world) {
      return NextResponse.json(
        { error: 'Invalid invite code. No world found matching this code.' },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMembership = await prisma.worldMember.findUnique({
      where: {
        worldId_userId: {
          worldId: world.id,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({
        message: `You are already a member of ${world.name}!`,
        world,
      });
    }

    // Add membership
    await prisma.worldMember.create({
      data: {
        worldId: world.id,
        userId: user.id,
        role: 'MEMBER',
      },
    });

    // Re-fetch world with updated member counts
    const updatedWorld = await prisma.world.findUnique({
      where: { id: world.id },
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

    return NextResponse.json({
      message: `Successfully joined ${world.name}!`,
      world: updatedWorld,
    });
  } catch (error) {
    console.error('Error joining world:', error);
    return NextResponse.json({ error: 'Failed to join world' }, { status: 500 });
  }
}
