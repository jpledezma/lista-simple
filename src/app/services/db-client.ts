import { Injectable, signal } from '@angular/core';
import { Item } from '../interfaces/item';
import { ItemList } from '../interfaces/item-list';

@Injectable({
  providedIn: 'root',
})
export class DbClient {
  private items: Item[] = [
    { id: 1, name: 'Celular' },
    { id: 2, name: 'Auriculares' },
    { id: 3, name: 'Cargador' },
    { id: 4, name: 'Mochila' },
    { id: 5, name: 'Botella de agua' },
  ];

  private lists = [
    { id: 1, name: 'General' },
    { id: 2, name: 'Deportes', icon: 'americanFootballOutline' },
  ];

  private lists_items: { itemId: number; listId: number }[] = [
    { listId: 1, itemId: 1 },
    { listId: 1, itemId: 2 },
    { listId: 1, itemId: 3 },
    { listId: 2, itemId: 2 },
    { listId: 2, itemId: 4 },
    { listId: 2, itemId: 5 },
  ];

  private _lastDeletedItemId = signal<number | null>(null);
  private _lastUpdatededItem = signal<Item | null>(null);
  private _lastUpdatedList = signal<ItemList | null>(null);
  private _lastCreatedItem = signal<{ item: Item; listsIds: number[] } | null>(
    null
  );
  private _lastCreatedList = signal<ItemList | null>(null);
  public lastDeletedItemId = this._lastDeletedItemId.asReadonly();
  public lastUpdatededItem = this._lastUpdatededItem.asReadonly();
  public lastUpdatedList = this._lastUpdatedList.asReadonly();
  public lastCreatedItem = this._lastCreatedItem.asReadonly();
  public lastCreatedList = this._lastCreatedList.asReadonly();

  async getListById(
    listId: number
  ): Promise<{ data: ItemList | null; error: any }> {
    const list = this.lists.find((l) => l.id === listId);
    if (!list) {
      return { data: null, error: 'List not found' };
    }

    return { data: list, error: null };
  }

  async getLists(): Promise<{ data: ItemList[]; error: any }> {
    const lists = [...this.lists];
    return { data: lists, error: null };
  }

  async getItems(): Promise<{ data: Item[]; error: any }> {
    const items = [...this.items];
    return { data: items, error: null };
  }

  async getItemsFromList(
    listId: number
  ): Promise<{ data: Item[]; error: any }> {
    const itemsIds: number[] = [];
    for (const relation of this.lists_items) {
      if (relation.listId === listId) {
        itemsIds.push(relation.itemId);
      }
    }
    const items = this.items.filter((item) => itemsIds.includes(item.id));

    return { data: items, error: null };
  }

  async createItem(
    listsIds: number[],
    item: Omit<Item, 'id'>
  ): Promise<{ data: Item | null; error: any }> {
    const randomId = Math.floor(Math.random() * 1000);

    const newItem = { id: randomId, ...item };
    this.items.push(newItem);
    for (const listId of listsIds) {
      this.lists_items.push({ itemId: newItem.id, listId });
    }

    this._lastCreatedItem.set({ item: newItem, listsIds });

    return { data: newItem, error: null };
  }

  async createList(
    list: Omit<ItemList, 'id'>,
    itemsIds: number[]
  ): Promise<{ data: ItemList | null; error: any }> {
    const randomId = Math.floor(Math.random() * 1000);

    const newList = { id: randomId, ...list };
    this.lists.push(newList);

    for (const itemId of itemsIds) {
      this.lists_items.push({ listId: newList.id, itemId });
    }

    this._lastCreatedList.set(newList);

    return { data: newList, error: null };
  }

  async updateItem(
    itemId: number,
    newItem: Omit<Item, 'id'>
  ): Promise<{ error: any }> {
    const itemIndex = this.items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      return { error: 'Item not found' };
    }

    this.items.splice(itemIndex, 1, { id: itemId, ...newItem });
    this._lastUpdatededItem.set({ id: itemId, ...newItem });
    return { error: null };
  }

  async updateList(
    listId: number,
    newList: Omit<ItemList, 'id'>,
    itemsIds: number[]
  ): Promise<{ error: any }> {
    const listIndex = this.lists.findIndex((list) => list.id === listId);

    if (listIndex === -1) {
      return { error: 'List not found' };
    }

    // update list data
    this.lists.splice(listIndex, 1, { id: listId, ...newList });
    // delete all relations including listId
    this.lists_items = this.lists_items.filter((rel) => rel.listId !== listId);
    // add new relations
    for (const itemId of itemsIds) {
      this.lists_items.push({ listId, itemId });
    }

    this._lastUpdatedList.set({ id: listId, ...newList });
    return { error: null };
  }

  async deleteItem(itemId: number): Promise<{ error: any }> {
    const itemIndex_items = this.items.findIndex((item) => item.id === itemId);
    this.items.splice(itemIndex_items, 1);

    const itemIndex_relation = this.lists_items.findIndex(
      (rel) => rel.itemId === itemId
    );
    this.lists_items.splice(itemIndex_relation, 1);

    this._lastDeletedItemId.set(itemId);

    return { error: null };
  }

  async deleteItemFromList(
    itemId: number,
    listId: number
  ): Promise<{ error: any }> {
    const relationIndex = this.lists_items.findIndex(
      (rel) => rel.itemId === itemId && rel.listId === listId
    );

    if (relationIndex === -1) {
      return { error: 'Item not found' };
    }

    this.lists_items.splice(relationIndex, 1);
    return { error: null };
  }
}
