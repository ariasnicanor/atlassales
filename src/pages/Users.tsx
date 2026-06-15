import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useData } from "@/data/store";
import { useSession } from "@/context/session";
import { useToast } from "@/components/ui/toast";
import { can, roleLabel } from "@/lib/permissions";
import type { UserRole } from "@/types";
import { ShieldCheck } from "lucide-react";

const roleVariant: Record<UserRole, "default" | "secondary" | "muted"> = {
  admin: "default",
  supervisor: "secondary",
  vendedor: "muted",
};

export default function Users() {
  const { users, updateUser } = useData();
  const { currentUser } = useSession();
  const { toast } = useToast();
  const isAdmin = can(currentUser, "manage_users");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gestión del equipo comercial y sus permisos."
        badge={isAdmin ? <Badge variant="success"><ShieldCheck className="size-3" /> Admin</Badge> : undefined}
      />

      {!isAdmin && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Estás viendo el equipo en modo lectura. Solo un <strong>Admin</strong> puede gestionar usuarios.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                {isAdmin && <TableHead className="text-right">Activo</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} src={u.avatar_url} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{u.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Select
                        value={u.role}
                        onChange={(e) => {
                          updateUser(u.id, { role: e.target.value as UserRole });
                          toast("Rol actualizado");
                        }}
                        className="w-36"
                      >
                        <option value="admin">Admin</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="vendedor">Vendedor</option>
                      </Select>
                    ) : (
                      <Badge variant={roleVariant[u.role]}>{roleLabel(u.role)}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.active ? "success" : "muted"}>{u.active ? "Activo" : "Inactivo"}</Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Switch
                          checked={u.active}
                          onCheckedChange={(v) => {
                            updateUser(u.id, { active: v });
                            toast(v ? "Usuario activado" : "Usuario desactivado");
                          }}
                          aria-label="Activar usuario"
                        />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {(["admin", "supervisor", "vendedor"] as UserRole[]).map((role) => (
          <Card key={role}>
            <CardContent className="space-y-2 p-4">
              <Badge variant={roleVariant[role]}>{roleLabel(role)}</Badge>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {role === "admin" && (<><li>• Ve todo</li><li>• Gestiona usuarios</li><li>• Configura empresa</li></>)}
                {role === "supervisor" && (<><li>• Ve al equipo</li><li>• Ve reportes</li><li>• Asigna leads</li></>)}
                {role === "vendedor" && (<><li>• Ve sus leads</li><li>• Ve sus tareas</li><li>• Gestiona su pipeline</li></>)}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
