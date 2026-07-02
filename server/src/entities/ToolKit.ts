import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { KitItem } from './KitItem';

@Entity({ name: 'tool_kits' })
export class ToolKit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  code!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ name: 'total_quantity', type: 'int' })
  totalQuantity!: number;

  @Column({ name: 'in_stock_quantity', type: 'int' })
  inStockQuantity!: number;

  @Column({ name: 'borrowed_quantity', type: 'int' })
  borrowedQuantity!: number;

  @Column({ name: 'waiting_sterilization_quantity', type: 'int' })
  waitingSterilizationQuantity!: number;

  @Column({ name: 'sterilizing_quantity', type: 'int' })
  sterilizingQuantity!: number;

  @Column({ name: 'damaged_quantity', type: 'int' })
  damagedQuantity!: number;

  @Column({ name: 'liquidated_quantity', type: 'int' })
  liquidatedQuantity!: number;

  @OneToMany(() => KitItem, (item) => item.kit, { cascade: true, eager: true, orphanedRowAction: 'delete' })
  items!: KitItem[];
}
