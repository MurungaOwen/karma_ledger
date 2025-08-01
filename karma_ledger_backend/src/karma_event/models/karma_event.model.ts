// src/karma-events/karma-event.model.ts

import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  PrimaryKey,
  Default,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../../users/models/users.model';

@Table({ tableName: 'karma_events', timestamps: true })
export class KarmaEvent extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  event_id: string;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  user_id: string;

  @Column(DataType.STRING)
  action: string;

  @Column(DataType.INTEGER)
  intensity: number;

  @Column(DataType.TEXT)
  reflection: string;

  @BelongsTo(() => User)
  user: User;

  @Column(DataType.TEXT)
  feedback: string; // AI-generated feedback based on action

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  feedback_generated: boolean;

  @Default(DataType.NOW)
  @Column(DataType.DATE)
  occurred_at: Date;
}
