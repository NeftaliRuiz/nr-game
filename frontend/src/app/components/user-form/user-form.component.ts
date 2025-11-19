import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEditMode = false;
  userId: string | null = null;
  successMessage = '';
  errorMessage = '';
  isLoading = false;

  roles = [
    { value: 'USER', label: 'User' },
    { value: 'ADMIN', label: 'Administrator' }
  ];

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      password: ['', [Validators.minLength(6)]],
      role: ['USER', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    
    if (this.userId) {
      this.isEditMode = true;
      // Password is optional when editing
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
      this.loadUser();
    } else {
      // Password is required when creating
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  loadUser(): void {
    if (!this.userId) return;

    this.isLoading = true;
    this.adminService.getUserById(this.userId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const user = response.data.user;
          this.userForm.patchValue({
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load user data';
        console.error('Error loading user:', error);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formData = { ...this.userForm.value };
    
    // Remove password if empty in edit mode
    if (this.isEditMode && !formData.password) {
      delete formData.password;
    }

    if (this.isEditMode && this.userId) {
      this.adminService.updateUser(this.userId, formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'User updated successfully!';
            setTimeout(() => {
              this.router.navigate(['/admin/users']);
            }, 1500);
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to update user';
          this.isLoading = false;
        }
      });
    } else {
      this.adminService.createUser(formData).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'User created successfully!';
            setTimeout(() => {
              this.router.navigate(['/admin/users']);
            }, 1500);
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to create user';
          this.isLoading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/users']);
  }

  getFieldError(fieldName: string): string {
    const control = this.userForm.get(fieldName);
    if (control?.touched && control.errors) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['minlength']) {
        return `Password must be at least ${control.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      name: 'Name',
      password: 'Password',
      role: 'Role'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.userForm.get(fieldName);
    return !!(control?.touched && control.invalid);
  }
}
