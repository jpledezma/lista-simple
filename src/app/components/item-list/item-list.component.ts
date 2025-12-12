import {
  Component,
  inject,
  input,
  signal,
  effect,
  untracked,
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ellipsisVertical } from 'ionicons/icons';

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
export class ItemListComponent {
  dbClient = inject(DbClient);
  alertController = inject(AlertController);

  listId = input.required<number>();
  items = signal<Item[] | null>(null);

  constructor() {
    addIcons({ ellipsisVertical });
    // Esto es porque el tabs de ionic carga todo al principio
    // efecto basado en this.listId()
    effect(async () => {
      this.items.set(null);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { data, error } = await this.dbClient.getItems(this.listId());
      if (error) {
        console.log(error);
      }

      this.items.set(data);
    });

    effect(() => {
      const itemId = this.dbClient.lastDeletedItemId();
      if (itemId !== null) {
        this.removeLocalItem(itemId);
      }
    });
  }

  async showDeleteItemAlert(itemId: number) {
    const alert = await this.alertController.create({
      header: 'Eliminar ítem',
      message:
        '¿Desea eliminar el ítem de todas las listas, o solo de la lista actual?',
      cssClass: 'delete-item-alert',
      buttons: [
        {
          text: 'Eliminar de todas las listas',
          role: 'confirm-all',
          handler: () => {
            this.deleteItem(itemId);
          },
        },
        {
          text: 'Eliminar de la lista actual',
          role: 'confirm',
          handler: () => {
            this.deleteItemFromList(itemId);
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

  async deleteItem(itemId: number) {
    const { error } = await this.dbClient.deleteItem(itemId);
    if (error) {
      console.log(error);
      return;
    }
  }

  async deleteItemFromList(itemId: number) {
    const { error } = await this.dbClient.deleteItemFromList(
      itemId,
      this.listId()
    );

    if (error) {
      console.log(error);
      return;
    }

    this.removeLocalItem(itemId);
  }

  removeLocalItem(itemId: number) {
    // untracked to prevent infinite loop on 'effect'
    const previousItems = untracked(this.items);
    if (previousItems === null) {
      return;
    }

    const filteredItems = previousItems.filter((item) => item.id !== itemId);
    this.items.set(filteredItems!);
  }
}
