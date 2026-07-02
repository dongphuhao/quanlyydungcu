import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { AuditAction } from './enums';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId?: string | null;

  @Column({ type: 'varchar', name: 'user_name' })
  userName!: string;

  @Column({ type: 'varchar' })
  action!: AuditAction;

  @Column({ type: 'varchar', name: 'entity_type' })
  entityType!: string;

  @Column({ type: 'varchar', name: 'entity_id', nullable: true })
  entityId?: string | null;

  @Column({ name: 'before_state', type: 'jsonb', nullable: true })
  beforeState?: unknown | null;

  @Column({ name: 'after_state', type: 'jsonb', nullable: true })
  afterState?: unknown | null;

  @Column({ type: 'text', nullable: true })
  details?: string | null;

  @Column({ type: 'boolean', default: true })
  success!: boolean;

  // Thời gian server, không phải client time — theo CLAUDE.md mục 4
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
