import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'tool_categories' })
export class ToolCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  name!: string;
}
