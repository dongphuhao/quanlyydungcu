import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BorrowForm } from './BorrowForm';
import { ToolKit } from './ToolKit';

@Entity({ name: 'borrow_items' })
export class BorrowItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => BorrowForm, (form) => form.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'borrow_form_id' })
  borrowForm!: BorrowForm;

  @Column({ type: 'varchar', name: 'borrow_form_id' })
  borrowFormId!: string;

  @ManyToOne(() => ToolKit, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'kit_id' })
  kit!: ToolKit;

  @Column({ type: 'uuid', name: 'kit_id' })
  kitId!: string;

  // Snapshot tên gói tại thời điểm mượn — giữ đúng hành vi cũ (item.name trong BorrowItem của types.ts)
  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'int' })
  quantity!: number;
}
