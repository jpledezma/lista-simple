import { inject, Injectable } from '@angular/core';
import { Item } from '../interfaces/item';
import { ItemList } from '../interfaces/item-list';
import {
  SQLiteConnection,
  CapacitorSQLite,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { DbSchemas } from './db-schemas';

@Injectable({
  providedIn: 'root',
})
export class DbClient {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private dbName = 'simple_list_db';
  private db?: SQLiteDBConnection;

  async initializeDatabase(): Promise<{ error: any }> {
    let error: any;
    try {
      this.db = await this.sqlite.createConnection(
        this.dbName,
        false,
        'no-encryption',
        1,
        false
      );

      await this.db?.open();

      await this.db?.execute(DbSchemas.items);
      await this.db?.execute(DbSchemas.lists);
      await this.db?.execute(DbSchemas.items_lists);

      error = null;
    } catch (err) {
      error = err;
    } finally {
      return { error };
    }
  }

  async getLists(): Promise<{ data: ItemList[]; error: any }> {
    const query = `SELECT * FROM lists`;

    let data: ItemList[] = [];
    let error: any = null;
    try {
      const result = await this.db?.query(query);
      if (result && result.values) {
        for (const list of result.values) {
          data.push({
            id: list.id,
            name: list.name,
            iconName: list.icon_name,
          });
        }
      } else {
        throw new Error('lists_not_found');
      }
    } catch (err) {
      console.log('ERROR ACA: ', JSON.stringify(err));

      error = err;
    }

    return { data, error };
  }

  async getListById(
    listId: number
  ): Promise<{ data: ItemList | null; error: any }> {
    const query = `SELECT * FROM lists WHERE id = ?`;

    let data: ItemList | null = null;
    let error: any = null;
    try {
      const result = await this.db?.query(query, [listId]);
      if (result && result.values) {
        data = {
          id: result.values[0].id,
          name: result.values[0].name,
          iconName: result.values[0].icon_name,
        };
      } else {
        throw new Error('list_not_found');
      }
    } catch (err) {
      error = err;
    }
    return { data, error };
  }

  async getItems(): Promise<{ data: Item[]; error: any }> {
    const query = `SELECT * FROM items`;

    let data: Item[] = [];
    let error: any = null;
    try {
      const result = await this.db?.query(query);
      if (result && result.values) {
        data = result.values;
      } else {
        throw new Error('items_not_found');
      }
    } catch (err) {
      error = err;
    }
    return { data, error };
  }

  async getItemsFromList(
    listId: number
  ): Promise<{ data: Item[]; error: any }> {
    const query = `
      SELECT * FROM items AS i
      INNER JOIN items_lists AS il
      ON i.id = il.item_id
      WHERE il.list_id = ?
    `;

    let data: Item[] = [];
    let error: any = null;
    try {
      const result = await this.db?.query(query, [listId]);
      if (result && result.values) {
        data = result.values;
      } else {
        throw new Error('items_not_found');
      }
    } catch (err) {
      error = err;
    }
    return { data, error };
  }

  async createItem(
    listsIds: number[],
    item: Omit<Item, 'id'>
  ): Promise<{ data: Item | null; error: any }> {
    const query = `
      INSERT INTO items (name, description)
      VALUES (?, ?)
      RETURNING *
    `;

    let data: Item | null = null;
    let error: any = null;
    try {
      const result = await this.db?.query(query, [item.name, item.description]);
      if (result && result.values) {
        data = {
          id: result.values[0].id,
          name: result.values[0].name,
          description: result.values[0].description,
        };
        const { error: relationError } = await this.addItemToLists(
          data.id,
          listsIds
        );
        error = relationError;
      } else {
        throw new Error('error_during_item_creation');
      }
    } catch (err) {
      error = err;
    }
    return { data, error };
  }

  async createList(
    list: Omit<ItemList, 'id'>,
    itemsIds: number[]
  ): Promise<{ data: ItemList | null; error: any }> {
    const query = `
      INSERT INTO lists (name, icon_name) 
      VALUES (?, ?)
      RETURNING *
    `;

    let data: ItemList | null = null;
    let error: any = null;
    try {
      const result = await this.db?.query(query, [list.name, list.iconName]);
      if (result && result.values) {
        data = {
          id: result.values[0].id,
          name: result.values[0].name,
          iconName: result.values[0].icon_name,
        };
        for (const itemId of itemsIds) {
          const { error: relationError } = await this.addItemToLists(itemId, [
            data.id,
          ]);
          error = relationError;
          if (error) break;
        }
      } else {
        throw new Error('error_during_list_creation');
      }
    } catch (err) {
      error = err;
    }
    return { data, error };
  }

  async updateItem(
    itemId: number,
    newItem: Omit<Item, 'id'>
  ): Promise<{ error: any }> {
    const query = `
    UPDATE items 
    SET name = ?, description = ?
    WHERE id = ?
    `;

    let error: any = null;
    try {
      await this.db?.query(query, [newItem.name, newItem.description, itemId]);
    } catch (err) {
      error = err;
    }

    return { error };
  }

  async updateList(
    listId: number,
    newList: Omit<ItemList, 'id'>,
    itemsIds: number[]
  ): Promise<{ error: any }> {
    const updateList = `
    UPDATE lists 
    SET name = ?, icon_name = ?
    WHERE id = ?
    `;

    const deletePreviousRelations = `
    DELETE FROM items_lists 
    WHERE list_id = ?
    `;

    const createNewRelations = `
    INSERT INTO items_lists (item_id, list_id)
    VALUES (?, ?)
    `;

    let error: any = null;
    try {
      await this.db?.query(updateList, [
        newList.name,
        newList.iconName,
        listId,
      ]);

      await this.db?.query(deletePreviousRelations, [listId]);
      for (const itemId of itemsIds) {
        await this.db?.query(createNewRelations, [itemId, listId]);
      }
    } catch (err) {
      error = err;
    }

    return { error };
  }

  async deleteItem(itemId: number): Promise<{ error: any }> {
    const query = `
    DELETE FROM items 
    WHERE id = ?
    `;

    let error: any = null;
    try {
      await this.db?.query(query, [itemId]);
    } catch (err) {
      error = err;
    }

    return { error };
  }

  async deleteItemFromList(
    itemId: number,
    listId: number
  ): Promise<{ error: any }> {
    const query = `
    DELETE FROM items_lists
    WHERE item_id = ? AND list_id = ?
    `;

    let error: any = null;
    try {
      await this.db?.query(query, [itemId, listId]);
    } catch (err) {
      error = err;
    }
    return { error };
  }

  async deleteList(listId: number): Promise<{ error: any }> {
    const query = `
    DELETE FROM lists 
    WHERE id = ?
    `;

    let error: any = null;
    try {
      await this.db?.query(query, [listId]);
    } catch (err) {
      error = err;
    }

    return { error };
  }

  async addItemToLists(
    itemId: number,
    listsIds: number[]
  ): Promise<{ error: any }> {
    const query = `
      INSERT INTO items_lists (item_id, list_id)
      VALUES (?, ?)
    `;

    let error: any = null;
    try {
      for (const listId of listsIds) {
        await this.db?.query(query, [itemId, listId]);
      }
    } catch (err) {
      error = err;
    }
    return { error };
  }
}
