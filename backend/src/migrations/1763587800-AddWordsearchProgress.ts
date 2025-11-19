import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWordsearchProgress1763587800 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'game_participants',
      new TableColumn({
        name: 'wordsearchProgress',
        type: 'jsonb',
        isNullable: true,
        default: null,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('game_participants', 'wordsearchProgress');
  }
}
