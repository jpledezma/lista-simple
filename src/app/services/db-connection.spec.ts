import { TestBed } from '@angular/core/testing';

import { DbConnection } from './db-connection';

describe('DbConnection', () => {
  let service: DbConnection;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DbConnection);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
