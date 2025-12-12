import { Injectable, Signal, signal } from '@angular/core';
import { Item } from '../interfaces/item';
import { ItemList } from '../interfaces/item-list';

@Injectable({
  providedIn: 'root',
})
export class DbClient {
  private items: Record<number, Item[]> = {
    1: [
      { id: 1, name: 'Celular' },
      { id: 2, name: 'Auriculares' },
      { id: 3, name: 'Cargador' },
    ],
    2: [
      { id: 2, name: 'Auriculares' },
      { id: 4, name: 'Mochila' },
      { id: 5, name: 'Botella de agua' },
    ],
  };

  private lists = [
    { id: 1, name: 'general' },
    { id: 2, name: 'deportes' },
  ];

  private _lastDeletedItemId = signal<number | null>(null);
  public lastDeletedItemId = this._lastDeletedItemId.asReadonly();

  async getLists(): Promise<{ data: ItemList[]; error: any }> {
    const lists = [...this.lists];
    return { data: lists, error: null };
  }

  async getItems(listId: number): Promise<{ data: Item[]; error: any }> {
    const items = [...this.items[listId]];
    return { data: items, error: null };
  }

  async createItem(
    listId: number,
    item: Omit<Item, 'id'>
  ): Promise<{ data: Item | null; error: any }> {
    const randomId = Math.floor(Math.random() * 1000);

    const newItem = { id: randomId, ...item };
    this.items[listId].push(newItem);

    return { data: newItem, error: null };
  }

  async updateItem(
    itemId: number,
    newItem: Omit<Item, 'id'>
  ): Promise<{ error: any }> {
    const itemIndex = this.items[1].findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      return { error: 'Item not found' };
    }

    this.items[1].splice(itemId, 1, { id: itemId, ...newItem });
    return { error: null };
  }

  async deleteItem(itemId: number): Promise<{ error: any }> {
    for (const listId in this.items) {
      const itemIndex = this.items[listId].findIndex(
        (item) => item.id === itemId
      );

      if (itemIndex === -1) {
        continue;
      }
      this.items[listId].splice(itemIndex, 1);
    }

    this._lastDeletedItemId.set(itemId);

    return { error: null };
  }

  async deleteItemFromList(
    itemId: number,
    listId: number
  ): Promise<{ error: any }> {
    const itemIndex = this.items[listId].findIndex(
      (item) => item.id === itemId
    );

    if (itemIndex === -1) {
      return { error: 'Item not found' };
    }

    this.items[1].splice(itemIndex, 1);
    return { error: null };
  }
}
