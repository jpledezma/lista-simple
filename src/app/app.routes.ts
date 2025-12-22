import { Routes } from '@angular/router';
import { HomePage } from './home/home.page';

export const routes: Routes = [
  {
    path: 'home',
    component: HomePage,
    children: [
      {
        path: 'default',
        loadComponent: () =>
          import('./components/default-tab/default-tab.component').then(
            (m) => m.DefaultTabComponent
          ),
      },
      {
        path: ':list-id',
        loadComponent: () =>
          import('./components/item-list/item-list.component').then(
            (m) => m.ItemListComponent
          ),
      },
    ],
  },
  {
    path: '',
    redirectTo: 'home/default',
    pathMatch: 'full',
  },
];
