import {
  Component,
  effect,
  inject,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
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
  dbClient = inject(DbClient);
  modalCtrl = inject(ModalController);

  lists = signal<ItemList[] | null>(null);

  constructor() {
    addIcons({ add, list, pricetagOutline });
    // update view on CREATE list
    effect(() => {
      const newListData = this.dbClient.lastCreatedList();
      if (newListData !== null) {
        const newList = { ...newListData };
        if (newList.icon) {
          newList.iconData = getIconData(newList.icon);
        }
        this.lists.update((previousItems) => [...previousItems!, newList]);
      }
    });

    // update view on UPDATE list
    effect(() => {
      const updatedList = this.dbClient.lastUpdatedList();
      if (updatedList !== null) {
        this.updateLocalList(updatedList);
      }
    });
  }

  async ngOnInit() {
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    const { data, error } = await this.dbClient.getLists();
    if (error) {
      console.log(error);
    }

    const lists: ItemList[] = [];
    for (const list of data) {
      if (list.icon) {
        const iconData = getIconData(list.icon);
        lists.push({ ...list, iconData });
      } else {
        lists.push({ ...list });
      }
    }

    this.lists.set(lists);
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

  updateLocalList(updatedList: ItemList) {
    // untracked to prevent infinite loop on 'effect'
    const listsValue = untracked(this.lists);
    if (listsValue === null) {
      return;
    }

    // copy to prevent Error: NG0100
    const previousLists = [...listsValue];

    const listIndex = previousLists.findIndex(
      (list) => list.id === updatedList.id
    );

    if (listIndex === -1) {
      return;
    }

    if (updatedList.icon) {
      updatedList.iconData = getIconData(updatedList.icon);
    }
    previousLists.splice(listIndex, 1, updatedList);
    this.lists.set(previousLists);
  }
}
