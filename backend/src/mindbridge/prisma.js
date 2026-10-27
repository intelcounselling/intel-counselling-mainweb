const { PrismaClient } = require('@prisma/client');
const { encryptJson, decryptJson, encryptText, decryptText } = require('./utils/fieldCrypto');

const globalForPrisma = globalThis;

const base = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = base;
}

// Encrypt the most sensitive fields on every write; decrypt on every read (including
// results loaded through other models). Older plaintext rows stay readable.
const ENCRYPTED = {
  testResult: { answers: [encryptJson, decryptJson] },
  counsellingNote: { summary: [encryptText, decryptText], goals: [encryptText, decryptText], nextSteps: [encryptText, decryptText] },
  appointment: { notes: [encryptText, decryptText] },
};

const sealData = (fields, data) => {
  if (!data || typeof data !== 'object') return data;
  const out = { ...data };
  for (const [f, [enc]] of Object.entries(fields)) {
    if (out[f] !== undefined) out[f] = enc(out[f]);
  }
  return out;
};

const query = {};
const result = {};
for (const [model, fields] of Object.entries(ENCRYPTED)) {
  query[model] = {
    async $allOperations({ operation, args, query: run }) {
      if (['create', 'update', 'updateMany'].includes(operation)) args.data = sealData(fields, args.data);
      if (operation === 'createMany') args.data = [].concat(args.data).map((d) => sealData(fields, d));
      if (operation === 'upsert') {
        args.create = sealData(fields, args.create);
        args.update = sealData(fields, args.update);
      }
      return run(args);
    },
  };
  result[model] = Object.fromEntries(
    Object.entries(fields).map(([f, [, dec]]) => [f, { needs: { [f]: true }, compute: (row) => dec(row[f]) }])
  );
}

module.exports = base.$extends({ query, result });
