import { Component, inject, input, signal, OnInit } from '@angular/core';
import { Item } from 'src/app/interfaces/item';
import { DbClient } from 'src/app/services/db-client';
import {
  IonList,
  IonLabel,
  IonItem,
  IonButton,
  IonIcon,
  IonCheckbox,
  IonPopover,
  IonContent,
  AlertController,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ellipsisVertical } from 'ionicons/icons';
import { AddItemComponent } from '../add-item/add-item.component';
import { AddListComponent } from '../add-list/add-list.component';
import { ItemList } from 'src/app/interfaces/item-list';
import { DbChangeType } from 'src/app/enums/db-change-type';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss'],
  imports: [
    IonContent,
    IonCheckbox,
    IonIcon,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonPopover,
  ],
})
export class ItemListComponent implements OnInit {
  dbClient = inject(DbClient);
  alertCtrl = inject(AlertController);
  modalCtrl = inject(ModalController);

  list = input.required<ItemList>();

  items = signal<Item[]>([]);
  loadingItems = true;

  constructor() {
    addIcons({ ellipsisVertical });
  }

  async ngOnInit() {
    this.dbClient.dbChanges.subscribe((change) => {
      switch (change.type) {
        case DbChangeType.ItemCreated:
        case DbChangeType.ListUpdated: {
          if (change.affectedLists!.includes(this.list().id)) {
            this.updateLocalList();
          }
          break;
        }
        case DbChangeType.ItemUpdated: {
          const itemIndex = this.items().findIndex(
            (item) => item.id === change.item?.id
          );
          if (itemIndex !== -1) {
            this.updateLocalItem(change.item!, itemIndex);
          }
          break;
        }
        case DbChangeType.ItemDeleted: {
          const itemInList = this.items().find(
            (item) => item.id === change.item?.id
          );
          if (itemInList) {
            this.removeLocalItem(itemInList.id);
          }
          break;
        }
      }
    });

    const { data, error } = await this.dbClient.getItemsFromList(
      this.list().id
    );

    if (error) {
      console.log(error);
    }
    this.items.set(data);
    this.loadingItems = false;
  }

  async openModifyItemForm(item: Item) {
    const modifyItemFormModal = await this.modalCtrl.create({
      component: AddItemComponent,
      componentProps: { itemToUpdate: { ...item } },
    });

    modifyItemFormModal.present();
  }

  async openModifyListForm() {
    const modifyListFormModal = await this.modalCtrl.create({
      component: AddListComponent,
      componentProps: {
        listIdToUpdate: this.list().id,
        listItemsToUpdate: this.items(),
      },
    });

    modifyListFormModal.present();
  }

  async showDeleteItemAlert(item: Item) {
    const alert = await this.alertCtrl.create({
      header: `Eliminar ${item.name}`,
      message:
        '¿Desea eliminar el ítem de todas las listas, o solo de la lista actual?',
      cssClass: 'delete-item-alert',
      buttons: [
        {
          text: 'Eliminar de todas las listas',
          role: 'confirm-all',
          handler: () => {
            this.deleteItem(item);
          },
        },
        {
          text: 'Eliminar de la lista actual',
          role: 'confirm',
          handler: () => {
            this.deleteItemFromList(item);
          },
        },
        {
          text: 'Cancelar',
          role: 'cancel',
        },
      ],
    });

    await alert.present();
  }

  async showDeleteListAlert() {
    const alert = await this.alertCtrl.create({
      header: `Eliminar ${this.list().name}`,
      subHeader: '¿Seguro que desea eliminar esta lista?',
      message:
        'Los ítems permanecerán guardados. Si quiere eliminarlos, deberá hacerlo manualmente',
      cssClass: 'delete-item-alert',
      buttons: [
        {
          text: 'Eliminar Lista',
          role: 'confirm',
          handler: () => {
            this.deleteList();
          },
        },
        {
          text: 'Cancelar',
          role: 'cancel',
        },
      ],
    });

    await alert.present();
  }

  async deleteItem(item: Item) {
    const { error } = await this.dbClient.deleteItem(item.id);
    if (error) {
      console.log(error);
      return;
    }
    this.removeLocalItem(item.id);
  }

  async deleteItemFromList(item: Item) {
    const { error } = await this.dbClient.deleteItemFromList(
      item.id,
      this.list().id
    );

    if (error) {
      console.log(error);
      return;
    }

    this.removeLocalItem(item.id);
  }

  async deleteList() {
    const { error } = await this.dbClient.deleteList(this.list().id);
    if (error) {
      console.log(error);
    }
  }

  addLocalItem(newItem: Item) {
    this.items.update((previousItems) => [...previousItems, newItem]);
  }

  updateLocalItem(updatedItem: Item, index: number) {
    // copy to prevent Error: NG0100
    const previousItems = [...this.items()];
    previousItems.splice(index, 1, updatedItem);
    this.items.set(previousItems);
  }

  removeLocalItem(itemId: number) {
    const filteredItems = this.items().filter((item) => item.id !== itemId);
    this.items.set(filteredItems);
  }

  async updateLocalList() {
    this.loadingItems = true;
    const listId = this.list().id;
    const [
      { data: list, error: listError },
      { data: items, error: itemsError },
    ] = await Promise.all([
      this.dbClient.getListById(listId),
      this.dbClient.getItemsFromList(listId),
    ]);

    if (listError || itemsError || !list || !items) {
      console.log('error');
      return;
    }

    this.list().name = list.name;
    this.list().iconName = list.iconName;
    this.items.set(items);
    this.loadingItems = false;
  }
}
