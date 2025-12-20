import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonFabList,
  IonIcon,
  IonTabBar,
  IonTabButton,
  IonTab,
  IonTabs,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, list, pricetagOutline } from 'ionicons/icons';
import { DbClient } from '../services/db-client';
import { ItemList } from '../interfaces/item-list';
import { ItemListComponent } from '../components/item-list/item-list.component';
import { AddItemComponent } from '../components/add-item/add-item.component';
import { AddListComponent } from '../components/add-list/add-list.component';
import { getIconData } from '../utils/icons';
import { Subject } from 'rxjs';
import { Item } from '../interfaces/item';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonTabs,
    IonTab,
    IonTabButton,
    IonTabBar,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFab,
    IonFabButton,
    IonFabList,
    IonIcon,
    ItemListComponent,
  ],
})
export class HomePage implements OnInit {
  @ViewChild('tabs') tabs!: IonTabs;
  dbClient = inject(DbClient);
  modalCtrl = inject(ModalController);

  lists = signal<ItemList[]>([]);
  loadingLists = true;

  createdItemSubject = new Subject<{ item: Item; listsIds: number[] }>();
  updatedItemSubject = new Subject<Item>();
  deletedItemSubject = new Subject<Item>();

  constructor() {
    addIcons({ add, list, pricetagOutline });
  }

  async ngOnInit() {
    await this.dbClient.initializeDatabase();
    const { data, error } = await this.dbClient.getLists();
    if (error) {
      console.log(error);
    }

    const lists: ItemList[] = [];
    for (const list of data) {
      const iconData = list.iconName ? getIconData(list.iconName) : undefined;
      lists.push({ ...list, iconData });
    }

    this.lists.set(lists);
    this.loadingLists = false;
  }

  async openAddItemForm() {
    const addItemFormModal = await this.modalCtrl.create({
      component: AddItemComponent,
    });

    addItemFormModal.present();

    const { data, role } = await addItemFormModal.onWillDismiss();
    if (data && role === 'confirm') {
      this.createdItemSubject.next(data);
    }
  }

  async openAddListForm() {
    const addItemFormModal = await this.modalCtrl.create({
      component: AddListComponent,
    });

    addItemFormModal.present();

    const { data, role } = await addItemFormModal.onWillDismiss();
    if (data && role === 'confirm') {
      this.addLocalList(data.list);
    }
  }

  notifyUpdatedItem(item: Item) {
    this.updatedItemSubject.next(item);
  }

  notifyDeletedItem(item: Item) {
    this.deletedItemSubject.next(item);
  }

  addLocalList(newList: ItemList) {
    const iconData = newList.iconName
      ? getIconData(newList.iconName)
      : undefined;
    const list = { ...newList, iconData };
    this.lists.update((previousLists) => [...previousLists, list]);
  }

  updateLocalList(updatedList: ItemList) {
    // copy to prevent Error: NG0100
    const previousLists = [...this.lists()];

    const listIndex = previousLists.findIndex(
      (list) => list.id === updatedList.id
    );

    if (listIndex !== -1) {
      updatedList.iconData = updatedList.iconName
        ? getIconData(updatedList.iconName)
        : undefined;
      previousLists.splice(listIndex, 1, updatedList);
      this.lists.set(previousLists);
    }
  }

  removeLocalList(deletedList: ItemList) {
    const previousLists = this.lists();
    const currentLists = previousLists.filter(
      (list) => list.id !== deletedList.id
    );

    this.lists.set(currentLists);

    if (currentLists.length > 0) {
      this.tabs.select(`${currentLists[0].id}`);
    }
  }
}
