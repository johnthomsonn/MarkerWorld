import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('Seeding database...');

  // 1. Create Demo Users
  const alex = await prisma.user.upsert({
    where: { email: 'alex@markerworld.dev' },
    update: {},
    create: {
      email: 'alex@markerworld.dev',
      name: 'Commander Alex',
      passwordHash: hashPassword('password123'),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const elena = await prisma.user.upsert({
    where: { email: 'elena@markerworld.dev' },
    update: {},
    create: {
      email: 'elena@markerworld.dev',
      name: 'Scout Elena',
      passwordHash: hashPassword('password123'),
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 2. Create Alex's World
  let world = await prisma.world.findUnique({
    where: { inviteCode: 'TERRA-777' },
  });

  if (!world) {
    world = await prisma.world.create({
      data: {
        name: 'Terra Nova Expedition',
        description: 'Global environmental research outposts and satellite beacon calibration points.',
        inviteCode: 'TERRA-777',
        ownerId: alex.id,
        members: {
          create: [
            { userId: alex.id, role: 'OWNER' },
            { userId: elena.id, role: 'MEMBER' },
          ],
        },
      },
    });
  }

  // 3. Create Seed Markers
  const sampleMarkers = [
    {
      title: 'Mount Everest High Ridge',
      description: 'South Col weather station telemetry beacon. Altitude 7,900m. Solar power array inspection required.',
      lat: 27.9881,
      lng: 86.9250,
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
      isResolved: true,
      resolvedAt: new Date(),
      resolvedBy: 'Commander Alex',
      createdById: alex.id,
    },
    {
      title: 'Great Barrier Reef Alpha Station',
      description: 'Coral bleaching sensor array. Real-time water temperature monitoring shows 0.4°C seasonal variance.',
      lat: -18.2871,
      lng: 147.6992,
      imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
      isResolved: false,
      createdById: alex.id,
    },
    {
      title: 'Pyramids of Giza Survey Hub',
      description: 'Subsurface muon tomography detector calibration unit. North-face alignment coordinates locked.',
      lat: 29.9792,
      lng: 31.1342,
      imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=800&auto=format&fit=crop&q=80',
      isResolved: false,
      createdById: elena.id,
    },
    {
      title: 'Amazon Canopy Outpost',
      description: 'Autonomous micro-drone atmospheric sampling station deep in the Amazon basin canopy.',
      lat: -3.4653,
      lng: -62.2159,
      imageUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&auto=format&fit=crop&q=80',
      isResolved: true,
      resolvedAt: new Date(),
      resolvedBy: 'Scout Elena',
      createdById: alex.id,
    },
    {
      title: 'Mariana Trench Hydrophone Alpha',
      description: 'Deep oceanic trench seismic listening array at 10,900m depth. Continuous hydro-acoustic feed.',
      lat: 11.3733,
      lng: 142.5917,
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      isResolved: false,
      createdById: elena.id,
    },
    {
      title: 'San Francisco Coastal Sentinel',
      description: 'Pacific marine fog density sensor and acoustic navigation repeater station.',
      lat: 37.8199,
      lng: -122.4783,
      imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&auto=format&fit=crop&q=80',
      isResolved: false,
      createdById: alex.id,
    },
  ];

  for (const m of sampleMarkers) {
    const existing = await prisma.marker.findFirst({
      where: {
        worldId: world.id,
        title: m.title,
      },
    });

    if (!existing) {
      await prisma.marker.create({
        data: {
          ...m,
          worldId: world.id,
        },
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
