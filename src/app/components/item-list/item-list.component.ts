import {
  Component,
  inject,
  input,
  signal,
  OnInit,
  output,
} from '@angular/core';
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
import { Subject } from 'rxjs';

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
  createdItemSubject =
    input.required<Subject<{ item: Item; listsIds: number[] }>>();
  updatedItemSubject = input.required<Subject<Item>>();
  deletedItemSubject = input.required<Subject<Item>>();

  itemUpdated = output<Item>();
  itemDeleted = output<Item>();
  listUpdated = output<ItemList>();
  listDeleted = output<ItemList>();

  items = signal<Item[]>([]);
  loadingItems = true;

  constructor() {
    addIcons({ ellipsisVertical });
  }

  async ngOnInit() {
    this.deletedItemSubject().subscribe((item) => {
      if (this.items().find((i) => i.id === item.id)) {
        this.removeLocalItem(item.id);
      }
    });

    this.createdItemSubject().subscribe(({ item, listsIds }) => {
      if (listsIds.includes(this.list().id)) {
        this.addLocalItem(item);
      }
    });

    this.updatedItemSubject().subscribe((item) => {
      const itemIndex = this.items().findIndex((i) => i.id === item.id);
      if (itemIndex !== -1) {
        this.updateLocalItem(item, itemIndex);
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
    const { data, role } = await modifyItemFormModal.onWillDismiss();

    if (data && role === 'confirm') {
      this.itemUpdated.emit(data.item as Item);
    }
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
    const { data, role } = await modifyListFormModal.onWillDismiss();

    if (data && role === 'confirm') {
      this.updateLocalList(data.list);
      this.listUpdated.emit(data.list as ItemList);
    }
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
    this.itemDeleted.emit(item);
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
      return;
    }
    this.listDeleted.emit(this.list());
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

  async updateLocalList(updatedList: ItemList) {
    this.loadingItems = true;
    const { data, error } = await this.dbClient.getItemsFromList(
      updatedList.id
    );
    if (error) {
      console.log(error);
    }
    this.items.set(data);
    this.loadingItems = false;
  }
}
