require('dotenv').config({ path: '../../.env.local' });
const { submitTest } = require('./src/controllers/student.controller');
const prisma = require('./src/prisma');

async function testSubmit() {
  try {
    const tests = await prisma.test.findMany();
    if (tests.length === 0) {
      console.log("No tests found");
      return;
    }
    const test = tests[0];
    const user = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
    if (!user) {
      console.log("No student found");
      return;
    }

    const req = {
      params: { testId: test.id },
      user: { id: user.id },
      body: {
        answers: { "Q1": 4, "Q2": 3 },
        shareWithTherapist: false
      }
    };

    const res = {
      status: (code) => {
        console.log("Status:", code);
        return res;
      },
      json: (data) => {
        console.log("Response:", JSON.stringify(data, null, 2));
      }
    };

    await submitTest(req, res);
  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testSubmit();
