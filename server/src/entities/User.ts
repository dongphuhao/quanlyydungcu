import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Role } from './enums';
import { Department } from './Department';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  username!: string;

  @Column({ type: 'varchar', name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'varchar', name: 'full_name' })
  fullName!: string;

  @Column({ type: 'varchar' })
  role!: Role;

  @Column({ type: 'varchar' })
  email!: string;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'department_id' })
  department?: Department | null;

  @Column({ type: 'uuid', name: 'department_id', nullable: true })
  departmentId?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
