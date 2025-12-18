import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Item } from 'src/app/interfaces/item';
import { DbClient } from 'src/app/services/db-client';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonTitle,
  IonToolbar,
  IonHeader,
  IonInput,
  IonTextarea,
  IonLabel,
  IonSelect,
  IonSelectOption,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { ItemList } from 'src/app/interfaces/item-list';

@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.scss'],
  imports: [
    IonLabel,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonIcon,
    IonContent,
    IonButton,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class AddItemComponent implements OnInit {
  dbClient = inject(DbClient);
  modalCtrl = inject(ModalController);

  itemToUpdate: Item | null = null;
  availableLists = signal<ItemList[]>([]);
  selectedLists = signal<number[]>([]);
  form: FormGroup;

  constructor() {
    addIcons({ close });

    this.form = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(3)]),
      description: new FormControl(''),
    });
  }

  async ngOnInit() {
    const { data, error } = await this.dbClient.getLists();
    if (error) {
      console.log(error);
    }
    this.availableLists.set(data || []);
    const item = this.itemToUpdate;
    if (item) {
      this.form.controls['name'].setValue(item.name);
      this.form.controls['description'].setValue(item.description || '');
    }
  }

  handleListSelection(event: Event) {
    const target = event.target as HTMLIonSelectElement;
    this.selectedLists.set(target.value);
  }

  async saveItem() {
    const name = this.form.get('name')!.value.trim();
    const description = this.form.get('description')!.value.trim() || null;
    const listsIds = this.selectedLists();
    const previousItem = this.itemToUpdate;

    if (previousItem !== null) {
      this.updateItem({ id: previousItem.id, name, description });
      return;
    }

    const { data, error } = await this.dbClient.createItem(listsIds, {
      name,
      description,
    });

    if (error || !data) {
      console.log(error);
      return;
    }

    this.modalCtrl.dismiss({ item: data, listsIds }, 'confirm');
  }

  async updateItem(item: Item) {
    const { error } = await this.dbClient.updateItem(item.id, { ...item });
    if (error) {
      console.log(error);
      return;
    }
    this.modalCtrl.dismiss({ item }, 'confirm');
  }

  close() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
