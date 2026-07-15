export declare class RolesService {
    getRoles(tenantId: string): Promise<{
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
        deletedAt: Date | null;
        tenantId: string | null;
        isSystem: boolean;
        permissions: {
            deletedAt: Date | null;
            roleId: string;
            permissionId: string;
            permission: {
                id: string;
                name: string;
                slug: string;
                createdAt: Date;
                deletedAt: Date | null;
                description: string | null;
            };
        }[];
    }[]>;
    getRoleById(tenantId: string, roleId: string): Promise<{
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
        deletedAt: Date | null;
        tenantId: string | null;
        isSystem: boolean;
        permissions: {
            deletedAt: Date | null;
            roleId: string;
            permissionId: string;
            permission: {
                id: string;
                name: string;
                slug: string;
                createdAt: Date;
                deletedAt: Date | null;
                description: string | null;
            };
        }[];
    }>;
    getAllPermissions(): Promise<{
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
        deletedAt: Date | null;
        description: string | null;
    }[]>;
    createRole(tenantId: string, name: string, permissionIds: string[]): Promise<{
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
        deletedAt: Date | null;
        tenantId: string | null;
        isSystem: boolean;
        permissions: {
            deletedAt: Date | null;
            roleId: string;
            permissionId: string;
            permission: {
                id: string;
                name: string;
                slug: string;
                createdAt: Date;
                deletedAt: Date | null;
                description: string | null;
            };
        }[];
    }>;
    updateRole(tenantId: string, roleId: string, name: string, permissionIds: string[]): Promise<{
        id: string;
        name: string;
        slug: string;
        createdAt: Date;
        deletedAt: Date | null;
        tenantId: string | null;
        isSystem: boolean;
        permissions: {
            deletedAt: Date | null;
            roleId: string;
            permissionId: string;
            permission: {
                id: string;
                name: string;
                slug: string;
                createdAt: Date;
                deletedAt: Date | null;
                description: string | null;
            };
        }[];
    }>;
    deleteRole(tenantId: string, roleId: string): Promise<{
        success: boolean;
    }>;
}
export declare const rolesService: RolesService;
