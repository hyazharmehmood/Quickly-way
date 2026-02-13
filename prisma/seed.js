const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const password = 'Saudivision@2030';
    const hashedPassword = await bcrypt.hash(password, 10);

    const admins = [
        { email: 'tahirhameed@yahoo.com', name: 'Tahir Hameed' },
        { email: 'tahirha@gmail.com', name: 'Tahir Hameed' },
    ];

    for (const { email, name } of admins) {
        const admin = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: 'ADMIN',
                name,
            },
            create: {
                email,
                name,
                password: hashedPassword,
                role: 'ADMIN',
                isSeller: false,
                sellerStatus: 'NONE',
            },
        });
        console.log('Admin seeded:', admin.email);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
