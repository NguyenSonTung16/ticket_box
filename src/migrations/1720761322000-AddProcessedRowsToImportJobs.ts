import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProcessedRowsToImportJobs1720761322000 implements MigrationInterface {
  name = 'AddProcessedRowsToImportJobs1720761322000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "import_jobs" ADD "processedRows" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "import_jobs" DROP COLUMN "processedRows"`);
  }
}
