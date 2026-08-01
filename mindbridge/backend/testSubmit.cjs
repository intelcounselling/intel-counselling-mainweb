require('dotenv').config({ path: '../../.env.local' });
const { calculateScore } = require('./src/utils/scoringLogic');
const { PrismaClient } = require('@prisma/client');

async function testSubmit() {
  const prisma = new PrismaClient();
  const test = await prisma.test.findFirst({ where: { category: 'StudyBehaviour' } });
  
  if (!test) {
    console.log('No test found');
    return;
  }
  
  let questions = test.questions;
  let thresholds = test.thresholds;
  
  if (typeof questions === 'string') {
    try { questions = JSON.parse(questions); } catch (e) { questions = []; }
  }
  if (typeof thresholds === 'string') {
    try { thresholds = JSON.parse(thresholds); } catch (e) { thresholds = []; }
  }
  
  console.log('Parsed questions type:', typeof questions, Array.isArray(questions) ? 'Array' : 'Not Array');
  console.log('First question:', questions[0]);
  
  const answersMap = { 'Q1': 5, 'Q2': 4, 'Q3': 3, 'Q4': 2 };
  
  const result = calculateScore(answersMap, questions, thresholds, test.category);
  console.log('Calculated Score Result:', result);
  
  // Test Prisma creation
  try {
    const dbResult = await prisma.testResult.create({
      data: {
        studentId: 'some-student-id', // We'll just see if validation passes before foreign key failure
        testId: test.id,
        score: result.score,
        maxScore: 60,
        severity: result.severity,
        isLow: result.isLow,
        answers: answersMap,
        subScores: result.subScores || undefined,
        sharedWithTherapist: false,
      }
    });
  } catch (err) {
    console.log('Prisma create error:', err.message);
  }
}

testSubmit();
