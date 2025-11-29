import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  inject,
  Signal,
  signal,
  effect,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';

import { Budget, BudgetRecord } from '@app/model/finance/planning/budgets';
import { ShareBudgetModalComponent } from '../share-budget-modal/share-budget-modal.component';
import { CreateBudgetModalComponent } from '../create-budget-modal/create-budget-modal.component';
import { ChildBudgetsModalComponent } from '../../modals/child-budgets-modal/child-budgets-modal.component';

@Component({
  selector: 'app-budget-table',
  templateUrl: './budget-table.component.html',
  styleUrls: ['./budget-table.component.scss'],
})
export class BudgetTableComponent {
  private router = inject(Router);
  private dialog = inject(MatDialog);

  /** SIGNAL-BASED INPUTS */
  @Input() budgets!: Signal<any[]>; // ← list of budgets
  @Input() overview!: Signal<BudgetRecord[]>;
  @Input() canPromote = false;

  @Output() doPromote = new EventEmitter<void>();

  /** MATERIAL TABLE */
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [
    'name',
    'status',
    'startYear',
    'duration',
    'actions',
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('sort', { static: true }) sort!: MatSort;

  constructor() {
    /** EFFECT: Reactively update material table when signal changes */
    effect(() => {
      const rows = this.budgets(); // signal value
      this.dataSource.data = rows ? rows : [];
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /** Access control stub */
  access(requested: any) {
    switch (requested) {
      case 'view':
      case 'clone':
      case 'edit':
        return true;
    }
    return false;
  }

  filterAccountRecords(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  promote() {
    if (this.canPromote) this.doPromote.emit();
  }

  openShareBudgetDialog(parent: Budget | false): void {
    this.dialog.open(ShareBudgetModalComponent, {
      panelClass: 'no-pad-dialog',
      width: '600px',
      data: parent ?? false,
    });
  }

  openCloneBudgetDialog(parent: Budget | false): void {
    this.dialog.open(CreateBudgetModalComponent, {
      height: 'fit-content',
      width: '600px',
      data: parent ?? false,
    });
  }

  openChildBudgetDialog(parent: Budget): void {
    let records = this.overview();
    let children = records.find((b) => b.budget.id === parent.id)?.children;
    children = children?.map((child) => child.budget);

    this.dialog.open(ChildBudgetsModalComponent, {
      height: 'fit-content',
      minWidth: '600px',
      data: { parent, budgets: children },
    });
  }

  goToDetail(budgetId: string, action: string) {
    this.router
      .navigate(['budgets', budgetId, action])
      .then(() => this.dialog.closeAll());
  }

  deleteBudget(budget: Budget) {}

  translateStatus(status: number) {
    switch (status) {
      case 1:
        return 'BUDGET.STATUS.ACTIVE';
      case 0:
        return 'BUDGET.STATUS.DESIGN';
      case 9:
        return 'BUDGET.STATUS.NO-USE';
      case -1:
        return 'BUDGET.STATUS.DELETED';
      default:
        return '';
    }
  }
}
