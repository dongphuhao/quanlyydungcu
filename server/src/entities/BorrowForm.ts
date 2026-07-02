import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { BorrowStatus } from './enums';
import { BorrowItem } from './BorrowItem';

// id giữ dạng mã phiếu người-đọc-được (vd. KNTQ000001), sinh theo mã khoa phòng — không dùng uuid.
@Entity({ name: 'borrow_forms' })
export class BorrowForm {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ type: 'varchar' })
  borrower!: string;

  @Column({ type: 'varchar' })
  department!: string;

  @Column({ name: 'request_date', type: 'timestamptz' })
  requestDate!: Date;

  @Column({ name: 'borrow_date', type: 'timestamptz', nullable: true })
  borrowDate?: Date | null;

  @Column({ name: 'return_date', type: 'timestamptz', nullable: true })
  returnDate?: Date | null;

  @Column({ type: 'varchar' })
  status!: BorrowStatus;

  @Column({ type: 'varchar', name: 'approved_by', nullable: true })
  approvedBy?: string | null;

  @OneToMany(() => BorrowItem, (item) => item.borrowForm, { cascade: true, eager: true, orphanedRowAction: 'delete' })
  items!: BorrowItem[];
}
