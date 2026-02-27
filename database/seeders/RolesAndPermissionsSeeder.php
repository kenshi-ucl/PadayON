<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles
        $owner = Role::firstOrCreate(['name' => 'owner', 'guard_name' => 'web']);
        $manager = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        $staff = Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        // Create permissions
        $permissions = [
            'manage_settings',
            'manage_users',
            'manage_products',
            'manage_customers',
            'manage_orders',
            'manage_reports',
            'manage_website',
            'process_sales',
            'view_reports',
            'manage_inventory',
            'manage_credits',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Owner gets all permissions
        $owner->syncPermissions($permissions);

        // Manager gets most permissions
        $manager->syncPermissions([
            'manage_products',
            'manage_customers',
            'manage_orders',
            'view_reports',
            'process_sales',
            'manage_inventory',
            'manage_credits',
        ]);

        // Staff gets limited permissions
        $staff->syncPermissions([
            'process_sales',
            'view_reports',
        ]);
    }
}
