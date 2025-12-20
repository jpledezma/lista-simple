import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { DbSchemas } from './db-schemas';

@Injectable({
  providedIn: 'root',
})
export class DbConnection {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private dbName = 'simple_list_db';
  db?: SQLiteDBConnection;

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

      await this.db.open();

      await this.db.execute(DbSchemas.items);
      await this.db.execute(DbSchemas.lists);
      await this.db.execute(DbSchemas.list_items);

      error = null;
    } catch (err) {
      error = err;
    } finally {
      return { error };
    }
  }
}
