import { Component, inject } from '@angular/core';
import {
  IonTitle,
  IonHeader,
  IonToolbar,
  IonContent,
  IonButton,
  ModalController,
} from '@ionic/angular/standalone';
import { AddListComponent } from '../add-list/add-list.component';

@Component({
  selector: 'app-default-tab',
  templateUrl: './default-tab.component.html',
  styleUrls: ['./default-tab.component.scss'],
  imports: [IonButton, IonContent, IonToolbar, IonHeader, IonTitle],
})
export class DefaultTabComponent {
  modalCtrl = inject(ModalController);

  constructor() {}

  async openAddListForm() {
    const addItemFormModal = await this.modalCtrl.create({
      component: AddListComponent,
    });

    addItemFormModal.present();
  }
}
