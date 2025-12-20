import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DbConnection } from './services/db-connection';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  dbConnection = inject(DbConnection);

  async ngOnInit() {
    console.log('CARGANDO CONEXION');
    const { error } = await this.dbConnection.initializeDatabase();
    if (error) {
      console.log('NO SE PUDO CONECTAR: \n', JSON.stringify(error));
    } else {
      console.log('CONEXION EXITOSA');
    }
  }
}
