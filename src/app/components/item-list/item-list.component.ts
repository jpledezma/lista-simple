import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
  effect,
} from '@angular/core';
import { Item } from 'src/app/interfaces/item';
import { DbClient } from 'src/app/services/db-client';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss'],
})
export class ItemListComponent {
  dbClient = inject(DbClient);

  listId = input.required<number>();
  items = signal<Item[] | null>(null);

  constructor() {
    effect(async () => {
      this.items.set(null);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { data, error } = await this.dbClient.getItems(this.listId());
      if (error) {
        console.log(error);
      }

      this.items.set(data);
    });
  }
}
