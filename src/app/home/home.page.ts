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
import { DbChangeType } from '../enums/db-change-type';

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

  constructor() {
    addIcons({ add, list, pricetagOutline });
  }

  async ngOnInit() {
    this.dbClient.dbChanges.subscribe((change) => {
      switch (change.type) {
        case DbChangeType.ListCreated: {
          this.addLocalList(change.list!);
          break;
        }
        case DbChangeType.ListUpdated: {
          this.updateLocalList(change.list!);
          break;
        }
        case DbChangeType.ListDeleted: {
          this.removeLocalList(change.list!);
          break;
        }
      }
    });

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
  }

  async openAddListForm() {
    const addItemFormModal = await this.modalCtrl.create({
      component: AddListComponent,
    });

    addItemFormModal.present();
  }

  addLocalList(newList: ItemList) {
    const iconData = newList.iconName
      ? getIconData(newList.iconName)
      : undefined;
    const list = { ...newList, iconData };
    this.lists.update((previousLists) => [...previousLists, list]);
    setTimeout(() => {
      this.tabs.select(`${list.id}`);
    }, 16);
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
