const prisma = require('./src/mindbridge/prisma');
const { regeneratePassword } = require('./src/mindbridge/services/credential.service');

async function test() {
  try {
    console.log('Testing transaction...');
    const name = 'Test School ' + Date.now();
    const address = 'Test Address';
    const adminFirstName = 'Admin';
    const adminLastName = 'User';
    const adminEmail = 'admin_' + Date.now() + '@test.com';
    const adminPhone = '123456789';
    const accessCode = 'TST' + Math.floor(100 + Math.random() * 900);
    const logoUrl = null;

    const { plainPassword, passwordHash } = await regeneratePassword();

    const [school, user] = await prisma.$transaction(async (tx) => {
      const sch = await tx.school.create({
        data: {
          name,
          address,
          contactEmail: adminEmail,
          contactPhone: adminPhone,
          accessCode,
          logoUrl
        },
      });

      const usr = await tx.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          role: 'SCHOOL_ADMIN',
          firstName: adminFirstName,
          lastName: adminLastName,
          phone: adminPhone,
          schoolId: sch.id,
          mustResetPassword: true,
          isOnboarded: false,
        }
      });

      return [sch, usr];
    });

    console.log('Success:', school, user);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
