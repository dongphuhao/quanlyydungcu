import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ToolKit } from './ToolKit';
import { MedicalTool } from './MedicalTool';

@Entity({ name: 'liquidation_logs' })
export class LiquidationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ToolKit, { nullable: true, eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'package_id' })
  package?: ToolKit | null;

  @Column({ type: 'uuid', name: 'package_id', nullable: true })
  packageId?: string | null;

  @ManyToOne(() => MedicalTool, { nullable: true, eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tool_id' })
  tool?: MedicalTool | null;

  @Column({ type: 'uuid', name: 'tool_id', nullable: true })
  toolId?: string | null;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'varchar' })
  reason!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'varchar', name: 'performed_by' })
  performedBy!: string;

  @Column({ type: 'timestamptz' })
  date!: Date;
}
