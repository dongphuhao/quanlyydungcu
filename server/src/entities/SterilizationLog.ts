import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SterilizationStatus } from './enums';
import { BorrowForm } from './BorrowForm';
import { ToolKit } from './ToolKit';

@Entity({ name: 'sterilization_logs' })
export class SterilizationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => BorrowForm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'borrow_slip_id' })
  borrowSlip!: BorrowForm;

  @Column({ type: 'varchar', name: 'borrow_slip_id' })
  borrowSlipId!: string;

  @ManyToOne(() => ToolKit, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'package_id' })
  package!: ToolKit;

  @Column({ type: 'uuid', name: 'package_id' })
  packageId!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'varchar', name: 'sterilized_by', nullable: true })
  sterilizedBy?: string | null;

  @Column({ name: 'started_date', type: 'timestamptz' })
  startedDate!: Date;

  @Column({ name: 'sterilized_date', type: 'timestamptz', nullable: true })
  sterilizedDate?: Date | null;

  @Column({ type: 'varchar' })
  status!: SterilizationStatus;
}
