import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ToolKit } from './ToolKit';
import { MedicalTool } from './MedicalTool';

@Entity({ name: 'kit_items' })
export class KitItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => ToolKit, (kit) => kit.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kit_id' })
  kit!: ToolKit;

  @Column({ type: 'uuid', name: 'kit_id' })
  kitId!: string;

  @ManyToOne(() => MedicalTool, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tool_id' })
  tool!: MedicalTool;

  @Column({ type: 'uuid', name: 'tool_id' })
  toolId!: string;

  @Column({ type: 'int' })
  quantity!: number;
}
