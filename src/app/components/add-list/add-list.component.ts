import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonTitle,
  IonToolbar,
  IonHeader,
  IonInput,
  IonLabel,
  IonSelect,
  IonSelectOption,
  ModalController,
  IonModal,
} from '@ionic/angular/standalone';
import { close } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { DbClient } from 'src/app/services/db-client';
import { IconPickerComponent } from '../icon-picker/icon-picker.component';
import { Item } from 'src/app/interfaces/item';
import { Icon, getIconData } from 'src/app/utils/icons';
import { ItemList } from 'src/app/interfaces/item-list';

@Component({
  selector: 'app-add-list',
  templateUrl: './add-list.component.html',
  styleUrls: ['./add-list.component.scss'],
  imports: [
    IonModal,
    IonLabel,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    IonContent,
    IonButton,
    IonInput,
    IonSelect,
    IonSelectOption,
    FormsModule,
    ReactiveFormsModule,
    IconPickerComponent,
  ],
})
export class AddListComponent implements OnInit {
  @ViewChild('selectIconModal', { static: true }) selectIconModal!: IonModal;
  dbClient = inject(DbClient);
  modalCtrl = inject(ModalController);

  itemsToAdd = signal<Item[]>([]);
  selectedItems = signal<number[]>([]);
  selectedIcon = signal<Icon | null>(null);

  listIdToUpdate: number | null = null;
  listItemsToUpdate: Item[] | null = null;

  form: FormGroup;
  constructor() {
    addIcons({ close });
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    });
  }

  async ngOnInit() {
    const { data: items, error: itemsError } = await this.dbClient.getItems();
    if (itemsError) {
      console.log(itemsError);
    }
    this.itemsToAdd.set(items);

    if (!this.listIdToUpdate || !this.listItemsToUpdate) {
      return;
    }

    const { data: list, error: listError } = await this.dbClient.getListById(
      this.listIdToUpdate
    );

    if (!list || listError) {
      console.log(listError);
      return;
    }

    this.selectedIcon.set(
      list.iconName
        ? { name: list.iconName, data: getIconData(list.iconName)! }
        : null
    );
    this.form.controls['name'].setValue(list.name);
    this.selectedItems.set(this.listItemsToUpdate.map((i) => i.id));
  }

  handleItemSelection(event: Event) {
    const target = event.target as HTMLIonSelectElement;
    this.selectedItems.set(target.value);
  }

  saveSelectedIcon(icon: Icon | null) {
    this.selectedIcon.set(icon);
    this.selectIconModal.dismiss();
  }

  closeIconSelect() {
    this.selectIconModal.dismiss();
  }

  async saveList() {
    const name = this.form.get('name')!.value.trim();
    const listData = { name, iconName: this.selectedIcon()?.name };
    const selectedItems = [...(this.selectedItems() || [])];

    if (this.listIdToUpdate && this.listItemsToUpdate) {
      this.updateList({ id: this.listIdToUpdate, ...listData }, selectedItems);
      return;
    }

    const { data, error } = await this.dbClient.createList(
      listData,
      selectedItems
    );

    if (error || !data) {
      console.log(error);
      return;
    }
    this.modalCtrl.dismiss({ list: data }, 'confirm');
  }

  async updateList(list: ItemList, selectedItems: number[]) {
    const { error } = await this.dbClient.updateList(
      list.id,
      list,
      selectedItems
    );
    if (error) {
      console.log(error);
      return;
    }
    this.modalCtrl.dismiss({ list }, 'confirm');
  }

  close() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
