export const DbSchemas = {
  items: `
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT
    );
  `,

  lists: `
    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon_name TEXT
    );
  `,

  items_lists: `
    CREATE TABLE IF NOT EXISTS items_lists (
      item_id INTEGER NOT NULL,
      list_id INTEGER NOT NULL,
      PRIMARY KEY (list_id, item_id),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    );
  `,
};
