import { Component, inject, Signal, signal, computed, effect } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { cloneDeep as ___cloneDeep, flatMap as __flatMap } from 'lodash';

import { Logger } from '@iote/bricks-angular';

import { Budget, BudgetRecord, BudgetStatus, OrgBudgetsOverview } from '@app/model/finance/planning/budgets';
import { BudgetsStore, OrgBudgetsStore } from '@app/state/finance/budgetting/budgets';

import { CreateBudgetModalComponent } from '../../components/create-budget-modal/create-budget-modal.component';

@Component({
  selector: 'app-select-budget',
  templateUrl: './select-budget.component.html',
  styleUrls: ['./select-budget.component.scss', '../../components/budget-view-styles.scss']
})
export class SelectBudgetPageComponent {

  private _orgBudgets$$ = inject(OrgBudgetsStore);
  private _budgets$$ = inject(BudgetsStore);
  private _dialog = inject(MatDialog);
  private _logger = inject(Logger);

  showFilter = false;

  // Signals
  overview: Signal<BudgetRecord[]> = signal([]);
  allBudgets: Signal<any[]> = signal([]);
  sharedBudgets: Signal<any[]> = signal([]);

  constructor() {
    // Effect to populate signals from the stores
    effect(() => {
      const overviewObs = this._orgBudgets$$.get()?.();
      const budgetsObs = this._budgets$$.get()?.();

      if (overviewObs && budgetsObs) {
        const flatOverview = __flatMap(overviewObs);
        const flatBudgets = __flatMap(budgetsObs);

        const trBudgets = flatBudgets.map((budget: any) => {
          budget['endYear'] = budget.startYear + budget.duration - 1;
          return budget;
        });

        this.overview.set(flatOverview.overview ?? []);
        this.allBudgets.set(trBudgets ?? []);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    // Apply filter logic here if needed
  }

  fieldsFilter(value: (Invoice) => boolean) {    
    // Filter logic placeholder
  }

  toogleFilter(value: boolean) {
    this.showFilter = value;
  }

  openDialog(parent: Budget | false): void {
    const dialog = this._dialog.open(CreateBudgetModalComponent, {
      height: 'fit-content',
      width: '600px',
      data: parent ?? false
    });

    dialog.afterClosed().subscribe(() => {
      // Dialog after action
    });
  }

  canPromote(record: BudgetRecord) {
    return (record.budget as any).canBeActivated;
  }

  setActive(record: BudgetRecord) {
    const toSave = ___cloneDeep(record.budget);

    delete (toSave as any).canBeActivated;
    delete (toSave as any).access;

    toSave.status = BudgetStatus.InUse;

    (<any> record).updating = true;
    this._budgets$$.update(toSave).subscribe(() => {
      (<any> record).updating = false;
      this._logger.log(() => `Updated Budget with id ${toSave.id}. Set as an active budget for this org.`); 
    });
  }
}
