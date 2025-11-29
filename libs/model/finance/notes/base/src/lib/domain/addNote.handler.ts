import { FunctionHandler } from '@iote/cqrs';
import {
  AddNoteToBudgetCommand,
  AddNoteToBudgetResult,
} from './add-note.command';

export class AddNoteToBudgetHandler extends FunctionHandler<
  AddNoteToBudgetCommand,
  AddNoteToBudgetResult
> {
  public async execute(
    command: AddNoteToBudgetCommand,
    { getRepository }
  ): Promise<AddNoteToBudgetResult> {
    // Basic validation
    if (!command.budgetId) throw new Error('Missing budgetId.');
    if (!command.content || command.content.trim().length === 0)
      throw new Error('Note content cannot be empty.');

    const repo = getRepository<any>('budgets');

    await repo.addNote(command.budgetId, {
      content: command.content,
      authorId: command.authorId,
      createdAt: command.createdAt,
    });

    return { success: true };
  }
}
