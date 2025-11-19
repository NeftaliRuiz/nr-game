import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoomCodeToGames1759935782304 implements MigrationInterface {
    name = 'AddRoomCodeToGames1759935782304'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add column as nullable first
        await queryRunner.query(`ALTER TABLE "games" ADD "roomCode" character varying(6)`);
        
        // 2. Generate unique room codes for existing games
        const existingGames = await queryRunner.query(`SELECT "id" FROM "games"`);
        
        for (const game of existingGames) {
            let roomCode: string;
            let isUnique = false;
            let attempts = 0;
            
            while (!isUnique && attempts < 20) {
                // Generate 6-character code
                const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                roomCode = '';
                for (let i = 0; i < 6; i++) {
                    roomCode += characters.charAt(Math.floor(Math.random() * characters.length));
                }
                
                // Check if code already exists
                const existing = await queryRunner.query(
                    `SELECT "id" FROM "games" WHERE "roomCode" = $1`,
                    [roomCode]
                );
                
                if (existing.length === 0) {
                    isUnique = true;
                    // Update the game with this code
                    await queryRunner.query(
                        `UPDATE "games" SET "roomCode" = $1 WHERE "id" = $2`,
                        [roomCode, game.id]
                    );
                }
                
                attempts++;
            }
        }
        
        // 3. Make column NOT NULL and add unique constraint
        await queryRunner.query(`ALTER TABLE "games" ALTER COLUMN "roomCode" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "games" ADD CONSTRAINT "UQ_b01c13c3be2f8b00da131bfbdf1" UNIQUE ("roomCode")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "UQ_b01c13c3be2f8b00da131bfbdf1"`);
        await queryRunner.query(`ALTER TABLE "games" DROP COLUMN "roomCode"`);
    }

}
