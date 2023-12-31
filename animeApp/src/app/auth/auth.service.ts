import { BehaviorSubject, Observable, from } from 'rxjs';
import { IAuthService, IAuthStatus } from './interfaces';

import { AngularFireAuth } from 'angularfire2/auth';
import { CacheService } from './cache.service';
import { Injectable } from '@angular/core';
import { Role } from './role.enum';
import { map } from 'rxjs/operators';

export const defaultAuthStatus: IAuthStatus = {
  isAuthenticated: false,
  userRole: Role.None,
  email: '',

};

export const defaultOkAuthStatus: IAuthStatus = {
  isAuthenticated: true,
  email: '',
  userRole: Role.Admin,
};

@Injectable()
export class AuthService extends CacheService implements IAuthService {
  authStatus = new BehaviorSubject<IAuthStatus>(
    this.getItem('authStatus') || defaultAuthStatus
  );

  constructor(private firebaseAuth: AngularFireAuth) {
    super();
    this.authStatus.subscribe(authStatus =>
      this.setItem('authStatus', authStatus)
    );
  }

  login(email: string, pass: string): Observable<IAuthStatus> {

    return from(
      this.firebaseAuth.auth.signInWithEmailAndPassword(email, pass).then(
        loginOkResponse => {
          this.onFirebaseLoginSuccessfull(loginOkResponse)
          this.getEmail(loginOkResponse)
        },
        loginErrorResponse => this.onFirebaseLoginFail(loginErrorResponse)
      ) as Promise<any>
    ).pipe(
      map(() => {
        return this.getItem('authStatus') as IAuthStatus;

      })
    );
  }

  logout() {
    this.firebaseAuth.auth.signOut().then(r => {
      this.authStatus.next(defaultAuthStatus);
    });
  }

  onFirebaseLoginSuccessfull(firebaseResponse) {
    console.log('Login ok', firebaseResponse.user.email);
    defaultOkAuthStatus.email=firebaseResponse.user.email
    this.authStatus.next(defaultOkAuthStatus);
  }
  getEmail(firebaseResponse){
    return  defaultOkAuthStatus.email=firebaseResponse.user.email
  }
  onFirebaseLoginFail(firebaseResponse) {
    console.log('Login fail', firebaseResponse);
    this.authStatus.next(defaultAuthStatus);
  }

  onError(err) {
    console.log(
      'Error al intentar autenticar credenciales en el servidor',
      err
    );
    this.setItem('authStatus', defaultAuthStatus);
    this.authStatus.next(defaultAuthStatus);
  }
}
