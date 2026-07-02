import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ToolStatus } from './enums';

@Entity({ name: 'medical_tools' })
export class MedicalTool {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  code!: string;

  @Column({ type: 'varchar' })
  name!: string;

  // Tên loại dụng cụ dạng chuỗi (khớp ToolCategory.name) — giữ như hợp đồng dữ liệu hiện tại của frontend,
  // chưa ràng buộc FK cứng để không phá vỡ luồng chọn category theo tên đang có ở ToolFormModal.
  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'varchar' })
  unit!: string;

  @Column({ name: 'total_quantity', type: 'int' })
  totalQuantity!: number;

  @Column({ name: 'available_quantity', type: 'int' })
  availableQuantity!: number;

  @Column({ type: 'varchar' })
  status!: ToolStatus;

  @Column({ name: 'entry_date', type: 'date' })
  entryDate!: string;

  @Column({ type: 'text', nullable: true })
  note?: string | null;
}
