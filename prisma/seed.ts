import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nnaudio.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@nnaudio.com',
      phone: '9999999999',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  })
  console.log('Admin created:', admin.email)

  // Sample products
  const products = [
    {
      name: 'NN-A4000 Pro Amplifier',
      slug: 'nn-a4000-pro-amplifier',
      sku: 'NNA-AMP-001',
      description: 'A high-power 4-channel amplifier delivering 100W RMS per channel with Class-D efficiency and audiophile-grade components.',
      category: 'amplifier' as const,
      badge: 'BESTSELLER' as const,
      specs: { 'Power Output': '100W RMS x 4', 'Frequency Response': '20Hz - 20kHz', 'SNR': '> 105dB', 'THD': '< 0.01%', 'Impedance': '2-8 Ohm' },
      variants: [
        { label: '2-Channel', price: 18999, stockQty: 15 },
        { label: '4-Channel', price: 28999, stockQty: 10 },
      ],
    },
    {
      name: 'NN-S650 Component Speakers',
      slug: 'nn-s650-component-speakers',
      sku: 'NNA-SPK-001',
      description: 'Premium 6.5" component speaker set with silk dome tweeters and polypropylene woofer cones for crystal clear sound.',
      category: 'speaker' as const,
      badge: 'TOP_RATED' as const,
      specs: { 'Size': '6.5"', 'Power Handling': '120W RMS', 'Sensitivity': '92dB', 'Frequency': '60Hz - 22kHz', 'Impedance': '4 Ohm' },
      variants: [
        { label: 'Pair (Standard)', price: 8999, stockQty: 25 },
        { label: 'Pair (Pro)', price: 12999, stockQty: 12 },
      ],
    },
    {
      name: 'NN-SUB12 Subwoofer',
      slug: 'nn-sub12-subwoofer',
      sku: 'NNA-SUB-001',
      description: '12" high-excursion subwoofer with a stamped steel basket and progressive spider design for deep, accurate bass.',
      category: 'subwoofer' as const,
      badge: 'NEW' as const,
      specs: { 'Size': '12"', 'Power Handling': '500W RMS', 'Sensitivity': '88dB', 'Frequency': '25Hz - 200Hz', 'Impedance': '2/4 Ohm DVC' },
      variants: [
        { label: '12" Single', price: 11999, stockQty: 20 },
        { label: '15" Single', price: 15999, stockQty: 8 },
      ],
    },
    {
      name: 'NN-DSP8 Processor',
      slug: 'nn-dsp8-processor',
      sku: 'NNA-DSP-001',
      description: '8-channel digital signal processor with 31-band EQ per channel and time alignment for precise soundstage control.',
      category: 'processor' as const,
      badge: 'PRO' as const,
      specs: { 'Channels': '8 In / 8 Out', 'EQ': '31-band per channel', 'Time Alignment': 'Up to 10ms', 'Bit Depth': '32-bit', 'Sample Rate': '96kHz' },
      variants: [
        { label: 'Standard', price: 21999, stockQty: 7 },
        { label: 'With Bluetooth Control', price: 26999, stockQty: 5 },
      ],
    },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.description,
        category: p.category,
        badge: p.badge,
        specs: p.specs,
        rating: 4.5 + Math.random() * 0.4,
        reviewCount: Math.floor(Math.random() * 100) + 20,
        variants: { create: p.variants },
      },
    })
    console.log('Product created:', p.name)
  }

  console.log('Seeding complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
