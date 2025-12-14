import { Component, inject, OnInit, signal } from '@angular/core';
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
  }

  async ngOnInit() {
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    const { data, error } = await this.dbClient.getLists();
    if (error) {
      console.log(error);
    }

    this.lists.set(data);
  }

  async openAddItemForm() {
    const addItemFormModal = await this.modalCtrl.create({
      component: AddItemComponent,
    });

    addItemFormModal.present();
  }
}
