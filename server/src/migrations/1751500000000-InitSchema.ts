import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1751500000000 implements MigrationInterface {
  name = 'InitSchema1751500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE departments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar NOT NULL UNIQUE,
        name varchar NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE tool_categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar NOT NULL UNIQUE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        username varchar NOT NULL UNIQUE,
        password_hash varchar NOT NULL,
        full_name varchar NOT NULL,
        role varchar NOT NULL,
        email varchar NOT NULL,
        department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE medical_tools (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar NOT NULL UNIQUE,
        name varchar NOT NULL,
        type varchar NOT NULL,
        unit varchar NOT NULL,
        total_quantity int NOT NULL,
        available_quantity int NOT NULL,
        status varchar NOT NULL,
        entry_date date NOT NULL,
        note text
      )
    `);

    await queryRunner.query(`
      CREATE TABLE tool_kits (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar NOT NULL UNIQUE,
        name varchar NOT NULL,
        type varchar NOT NULL,
        total_quantity int NOT NULL,
        in_stock_quantity int NOT NULL,
        borrowed_quantity int NOT NULL,
        waiting_sterilization_quantity int NOT NULL,
        sterilizing_quantity int NOT NULL,
        damaged_quantity int NOT NULL,
        liquidated_quantity int NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE kit_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        kit_id uuid NOT NULL REFERENCES tool_kits(id) ON DELETE CASCADE,
        tool_id uuid NOT NULL REFERENCES medical_tools(id) ON DELETE RESTRICT,
        quantity int NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE borrow_forms (
        id varchar PRIMARY KEY,
        borrower varchar NOT NULL,
        department varchar NOT NULL,
        request_date timestamptz NOT NULL,
        borrow_date timestamptz,
        return_date timestamptz,
        status varchar NOT NULL,
        approved_by varchar
      )
    `);

    await queryRunner.query(`
      CREATE TABLE borrow_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        borrow_form_id varchar NOT NULL REFERENCES borrow_forms(id) ON DELETE CASCADE,
        kit_id uuid NOT NULL REFERENCES tool_kits(id) ON DELETE RESTRICT,
        name varchar NOT NULL,
        quantity int NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE sterilization_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        borrow_slip_id varchar NOT NULL REFERENCES borrow_forms(id) ON DELETE CASCADE,
        package_id uuid NOT NULL REFERENCES tool_kits(id) ON DELETE RESTRICT,
        quantity int NOT NULL,
        sterilized_by varchar,
        started_date timestamptz NOT NULL,
        sterilized_date timestamptz,
        status varchar NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE liquidation_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        package_id uuid REFERENCES tool_kits(id) ON DELETE SET NULL,
        tool_id uuid REFERENCES medical_tools(id) ON DELETE SET NULL,
        quantity int NOT NULL,
        reason varchar NOT NULL,
        notes text,
        performed_by varchar NOT NULL,
        date timestamptz NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        user_name varchar NOT NULL,
        action varchar NOT NULL,
        entity_type varchar NOT NULL,
        entity_id varchar,
        before_state jsonb,
        after_state jsonb,
        details text,
        success boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_borrow_forms_status ON borrow_forms(status)`);
    await queryRunner.query(`CREATE INDEX idx_sterilization_logs_borrow_slip_id ON sterilization_logs(borrow_slip_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS liquidation_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS sterilization_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS borrow_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS borrow_forms`);
    await queryRunner.query(`DROP TABLE IF EXISTS kit_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS tool_kits`);
    await queryRunner.query(`DROP TABLE IF EXISTS medical_tools`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TABLE IF EXISTS tool_categories`);
    await queryRunner.query(`DROP TABLE IF EXISTS departments`);
  }
}
