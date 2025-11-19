import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map, take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    // Check if token exists in localStorage
    const token = this.authService.getToken();
    
    if (!token) {
      // No token, redirect to login with return url
      this.router.navigate(['/admin/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Token exists, wait for user to load
    if (this.authService.isUserLoading()) {
      // Return observable that waits for loading to complete
      return this.authService.userLoading$.pipe(
        // Wait until loading is false
        map(loading => !loading),
        // Only take the first "not loading" value
        take(1),
        // Then check authorization
        map(() => {
          const currentUser = this.authService.currentUserValue;
          
          if (!currentUser) {
            // User failed to load, redirect to login
            this.router.navigate(['/admin/login'], { queryParams: { returnUrl: state.url } });
            return false;
          }

          // Check if route requires admin
          if (route.data['requireAdmin'] && !this.authService.isAdmin()) {
            // Not admin, redirect to home
            this.router.navigate(['/']);
            return false;
          }

          // User is authenticated and authorized
          return true;
        })
      );
    }

    // User already loaded
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      // No user data, redirect to login
      this.router.navigate(['/admin/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Check if route requires admin
    if (route.data['requireAdmin'] && !this.authService.isAdmin()) {
      // Not admin, redirect to home
      this.router.navigate(['/']);
      return false;
    }

    // User is authenticated and authorized
    return true;
  }
}
