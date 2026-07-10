/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000, // 30s timeout cho integration test (gọi HTTP thật)
  // Chỉ chạy integration tests (không chạy unit tests cũ)
  testMatch: ['**/tests/**/*.integration.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
      },
    }],
  },
  // Hiển thị chi tiết từng test case
  verbose: true,
  // Chạy tuần tự (không song song) vì tests phụ thuộc nhau theo chain
  runInBand: true,
};
