import { TestBed } from '@angular/core/testing';

import { DbClient } from './db-client';

describe('DbClient', () => {
  let service: DbClient;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DbClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
