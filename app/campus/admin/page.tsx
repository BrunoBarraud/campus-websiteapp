"use client";

// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import {
  User,
  Subject,
  UserRole,
  CreateUserForm,
  CreateSubjectForm,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AcademicUtils } from "@/constant/academic";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UsersIcon,
  BookOpenIcon,
  BarChart3Icon,
  PlusIcon,
  RefreshCwIcon,
  EditIcon,
  UserCheckIcon,
  UserXIcon,
  GraduationCapIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";

interface AdminDashboardProps {}

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const [activeTab, setActiveTab] = useState<"users" | "subjects" | "stats">(
    "users"
  );
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Formularios
  const [userForm, setUserForm] = useState<CreateUserForm>({
    name: "",
    email: "",
    password: "",
    role: "student",
    year: 1,
    phone: "",
    bio: "",
  });

  const [subjectForm, setSubjectForm] = useState<CreateSubjectForm>({
    name: "",
    code: "",
    description: "",
    year: 1,
    semester: 1,
    credits: 0,
    teacher_id: "",
  });

  const [filters, setFilters] = useState({
    userRole: "" as UserRole | "",
    userYear: "",
    subjectYear: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadSubjects(), loadTeachers()]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await fetch("/api/admin/subjects");
      const data = await response.json();
      if (data.success) {
        setSubjects(data.subjects);
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await fetch("/api/admin/users?role=teacher");
      const data = await response.json();
      if (data.success) {
        setTeachers(data.users);
      }
    } catch (error) {
      console.error("Error loading teachers:", error);
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Usuario creado exitosamente");
        setShowUserModal(false);
        resetUserForm();
        loadUsers();
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Error al crear usuario");
    }
  };

  const handleCreateSubject = async () => {
    try {
      const response = await fetch("/api/admin/subjects", {
        method: editingSubject ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingSubject
            ? { ...subjectForm, id: editingSubject.id }
            : subjectForm
        ),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingSubject
            ? "Materia actualizada exitosamente"
            : "Materia creada exitosamente"
        );
        setShowSubjectModal(false);
        resetSubjectForm();
        loadSubjects();
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error saving subject:", error);
      toast.error("Error al guardar materia");
    }
  };

  const handleAssignTeacher = async (subjectId: string, teacherId: string) => {
    try {
      const response = await fetch(`/api/admin/subjects/${subjectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: teacherId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Profesor asignado exitosamente");
        loadSubjects();
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error assigning teacher:", error);
      toast.error("Error al asignar profesor");
    }
  };

  const resetUserForm = () => {
    setUserForm({
      name: "",
      email: "",
      password: "",
      role: "student",
      year: 1,
      phone: "",
      bio: "",
    });
    setEditingUser(null);
  };

  const resetSubjectForm = () => {
    setSubjectForm({
      name: "",
      code: "",
      description: "",
      year: 1,
      semester: 1,
      credits: 0,
      teacher_id: "",
    });
    setEditingSubject(null);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <ShieldCheckIcon className="h-4 w-4" />;
      case "teacher":
        return <GraduationCapIcon className="h-4 w-4" />;
      case "student":
        return <UserIcon className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "teacher":
        return "bg-blue-100 text-blue-800";
      case "student":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    return AcademicUtils.getRoleName(role);
  };

  // Filtrar datos
  const filteredUsers = users.filter((user) => {
    if (filters.userRole && user.role !== filters.userRole) return false;
    if (filters.userYear && user.year?.toString() !== filters.userYear)
      return false;
    return true;
  });

  const filteredSubjects = subjects.filter((subject) => {
    if (filters.subjectYear && subject.year.toString() !== filters.subjectYear)
      return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Cargando panel de administración...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Administración
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona usuarios, materias y configuraciones del campus
          </p>
        </div>

        {/* Modern Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpenIcon className="h-4 w-4" />
              Materias
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3Icon className="h-4 w-4" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          {/* USUARIOS TAB */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5" />
                    Gestión de Usuarios
                  </CardTitle>
                  <Button onClick={() => setShowUserModal(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Crear Usuario
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="flex gap-4 mb-6">
                  <Select
                    value={filters.userRole}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        userRole: value as UserRole | "",
                      })
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los roles</SelectItem>
                      <SelectItem value="admin">Administradores</SelectItem>
                      <SelectItem value="teacher">Profesores</SelectItem>
                      <SelectItem value="student">Estudiantes</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.userYear}
                    onValueChange={(value) =>
                      setFilters({ ...filters, userYear: value })
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por año" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los años</SelectItem>
                      {AcademicUtils.getYearOptions().map(
                        ({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" onClick={loadUsers}>
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>
                </div>

                {/* Tabla de usuarios */}
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-4 font-medium">Usuario</th>
                        <th className="text-left p-4 font-medium">Rol</th>
                        <th className="text-left p-4 font-medium">Año</th>
                        <th className="text-left p-4 font-medium">Estado</th>
                        <th className="text-left p-4 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                                {getRoleIcon(user.role)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getRoleColor(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-gray-900">
                            {user.year ? `${user.year}° año` : "-"}
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={user.is_active ? "default" : "secondary"}
                            >
                              {user.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                {user.is_active ? (
                                  <UserXIcon className="h-4 w-4" />
                                ) : (
                                  <UserCheckIcon className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No se encontraron usuarios con los filtros aplicados.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MATERIAS TAB */}
          <TabsContent value="subjects" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpenIcon className="h-5 w-5" />
                    Gestión de Materias
                  </CardTitle>
                  <Button onClick={() => setShowSubjectModal(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Crear Materia
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="flex gap-4 mb-6">
                  <Select
                    value={filters.subjectYear}
                    onValueChange={(value) =>
                      setFilters({ ...filters, subjectYear: value })
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por año" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los años</SelectItem>
                      {AcademicUtils.getYearOptions().map(
                        ({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" onClick={loadSubjects}>
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>
                </div>

                {/* Grid de materias */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSubjects.map((subject) => (
                    <Card
                      key={subject.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {subject.name}
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              Código: {subject.code}
                            </p>
                            <p className="text-sm text-gray-500">
                              {subject.year}° año • {subject.credits} créditos
                            </p>
                          </div>
                          <Badge variant="outline">
                            {subject.semester}° sem
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {subject.description && (
                          <p className="text-sm text-gray-600 mb-4">
                            {subject.description}
                          </p>
                        )}

                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-gray-500">
                              Profesor asignado:
                            </Label>
                            <p className="text-sm font-medium">
                              {(subject as any).teacher?.name || "Sin asignar"}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Select
                              onValueChange={(value) =>
                                value && handleAssignTeacher(subject.id, value)
                              }
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Asignar profesor" />
                              </SelectTrigger>
                              <SelectContent>
                                {teachers.map((teacher) => (
                                  <SelectItem
                                    key={teacher.id}
                                    value={teacher.id}
                                  >
                                    {teacher.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Button variant="outline" size="sm">
                              <EditIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredSubjects.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron materias con los filtros aplicados.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ESTADÍSTICAS TAB */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Usuarios
                  </CardTitle>
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {users.filter((u) => u.is_active).length} activos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Estudiantes
                  </CardTitle>
                  <GraduationCapIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {users.filter((u) => u.role === "student").length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {
                      users.filter((u) => u.role === "student" && u.is_active)
                        .length
                    }{" "}
                    activos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Profesores
                  </CardTitle>
                  <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {users.filter((u) => u.role === "teacher").length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {
                      users.filter((u) => u.role === "teacher" && u.is_active)
                        .length
                    }{" "}
                    activos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Materias
                  </CardTitle>
                  <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{subjects.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {subjects.filter((s) => (s as any).teacher).length} con
                    profesor asignado
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal para crear/editar usuario */}
        <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Modifica los datos del usuario."
                  : "Completa la información para crear un nuevo usuario."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  value={userForm.name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, name: e.target.value })
                  }
                  placeholder="Ingresa el nombre completo"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                  placeholder="Contraseña segura"
                />
              </div>

              <div>
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={userForm.role}
                  onValueChange={(value) =>
                    setUserForm({ ...userForm, role: value as UserRole })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Estudiante</SelectItem>
                    <SelectItem value="teacher">Profesor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {userForm.role === "student" && (
                <div>
                  <Label htmlFor="year">Año de cursado</Label>
                  <Select
                    value={userForm.year?.toString()}
                    onValueChange={(value) =>
                      setUserForm({ ...userForm, year: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar año" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}° año
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUserModal(false);
                    resetUserForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser}>
                  {editingUser ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para crear/editar materia */}
        <Dialog open={showSubjectModal} onOpenChange={setShowSubjectModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingSubject ? "Editar Materia" : "Crear Nueva Materia"}
              </DialogTitle>
              <DialogDescription>
                {editingSubject
                  ? "Modifica los datos de la materia."
                  : "Completa la información para crear una nueva materia."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject-name">Nombre de la materia</Label>
                <Input
                  id="subject-name"
                  value={subjectForm.name}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, name: e.target.value })
                  }
                  placeholder="Ingresa el nombre de la materia"
                />
              </div>

              <div>
                <Label htmlFor="subject-code">Código</Label>
                <Input
                  id="subject-code"
                  value={subjectForm.code}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, code: e.target.value })
                  }
                  placeholder="Ej: MAT101"
                />
              </div>

              <div>
                <Label htmlFor="subject-description">Descripción</Label>
                <Textarea
                  id="subject-description"
                  value={subjectForm.description}
                  onChange={(e) =>
                    setSubjectForm({
                      ...subjectForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Descripción de la materia"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="subject-year">Año</Label>
                  <Select
                    value={subjectForm.year.toString()}
                    onValueChange={(value) =>
                      setSubjectForm({ ...subjectForm, year: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}°
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject-semester">Semestre</Label>
                  <Select
                    value={subjectForm.semester?.toString() || ""}
                    onValueChange={(value) =>
                      setSubjectForm({
                        ...subjectForm,
                        semester: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1°</SelectItem>
                      <SelectItem value="2">2°</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject-credits">Créditos</Label>
                  <Input
                    id="subject-credits"
                    type="number"
                    value={subjectForm.credits}
                    onChange={(e) =>
                      setSubjectForm({
                        ...subjectForm,
                        credits: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subject-teacher">
                  Profesor asignado (opcional)
                </Label>
                <Select
                  value={subjectForm.teacher_id}
                  onValueChange={(value) =>
                    setSubjectForm({ ...subjectForm, teacher_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar profesor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin asignar</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSubjectModal(false);
                    resetSubjectForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateSubject}>
                  {editingSubject ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
