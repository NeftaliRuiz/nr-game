import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { Router } from '@angular/router';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  isActive?: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error = '';
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  limit = 10;
  total = 0;

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';

    this.adminService.getUsers(this.currentPage, this.limit).subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.data.users;
          this.total = response.data.total;
          this.totalPages = Math.ceil(this.total / this.limit);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users';
        this.loading = false;
        console.error(err);
      }
    });
  }

  createUser(): void {
    this.router.navigate(['/admin/users/new']);
  }

  editUser(id: string): void {
    this.router.navigate(['/admin/users/edit', id]);
  }

  deleteUser(id: string, name: string): void {
    if (confirm(`Are you sure you want to delete user "${name}"?`)) {
      this.adminService.deleteUser(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadUsers();
          }
        },
        error: (err) => {
          alert('Failed to delete user');
          console.error(err);
        }
      });
    }
  }

  toggleRole(user: User): void {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (confirm(`Change ${user.name}'s role to ${newRole}?`)) {
      this.adminService.updateUser(user.id, { role: newRole }).subscribe({
        next: () => this.loadUsers(),
        error: (err) => {
          alert('Failed to update role');
          console.error(err);
        }
      });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  getRoleBadgeClass(role: string): string {
    return role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  }

  getEndRecord(): number {
    return Math.min(this.currentPage * this.limit, this.total);
  }
}
