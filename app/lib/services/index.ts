// 📚 Servicios para manejar datos del Campus Virtual

import { supabase, supabaseAdmin } from '@/app/lib/supabaseClient';
import { 
  User, 
  Subject, 
  SubjectUnit,
  SubjectContent,
  CalendarEvent, 
  Document, 
  UserRole,
  ContentType,
  CreateUserForm,
  CreateSubjectForm,
  CreateEventForm,
  CreateDocumentForm,
  UserFilter,
  EventFilter,
  DocumentFilter
} from '@/app/lib/types';

// 👥 SERVICIOS DE USUARIOS
export const userService = {
  // Obtener usuario actual con su rol y permisos
  async getCurrentUser(): Promise<User | null> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    return data;
  },

  // Obtener todos los usuarios (solo admins)
  async getAllUsers(filter?: UserFilter): Promise<User[]> {
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter?.role) {
      query = query.eq('role', filter.role);
    }

    if (filter?.year) {
      query = query.eq('year', filter.year);
    }

    if (filter?.is_active !== undefined) {
      query = query.eq('is_active', filter.is_active);
    }

    if (filter?.search) {
      query = query.or(`name.ilike.%${filter.search}%,email.ilike.%${filter.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting users:', error);
      return [];
    }

    return data || [];
  },

  // Crear nuevo usuario (solo admins)
  async createUser(userData: CreateUserForm): Promise<User | null> {
    // Primero crear en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirmar email para usuarios creados por admin
      user_metadata: {
        name: userData.name,
        role: userData.role
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Error creating user');
    }

    // Luego crear en la tabla users
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        year: userData.year,
        phone: userData.phone,
        bio: userData.bio,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user in database:', error);
      // Limpiar usuario de auth si falla la inserción en BD
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error('Error creating user profile');
    }

    return data;
  },

  // Actualizar usuario
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Eliminar usuario (desactivar)
  async deleteUser(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }

    return true;
  }
};

// 📚 SERVICIOS DE MATERIAS
export const subjectService = {
  // Obtener materias según el rol del usuario
  async getSubjects(userRole: UserRole, userId?: string, year?: number): Promise<Subject[]> {
    let query = supabase
      .from('subjects')
      .select(`
        *,
        teacher:users!teacher_id(id, name, email)
      `)
      .eq('is_active', true)
      .order('year', { ascending: true })
      .order('name', { ascending: true });

    // Filtrar según el rol
    if (userRole === 'student' && year) {
      query = query.eq('year', year);
    } else if (userRole === 'teacher' && userId) {
      query = query.eq('teacher_id', userId);
    }
    // Los admins ven todas las materias (sin filtro adicional)

    const { data, error } = await query;

    if (error) {
      console.error('Error getting subjects:', error);
      return [];
    }

    return data || [];
  },

  // Crear nueva materia (solo admins)
  async createSubject(subjectData: CreateSubjectForm): Promise<Subject | null> {
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .insert(subjectData)
      .select(`
        *,
        teacher:users!teacher_id(id, name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating subject:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Actualizar materia
  async updateSubject(id: string, updates: Partial<Subject>): Promise<Subject | null> {
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        teacher:users!teacher_id(id, name, email)
      `)
      .single();

    if (error) {
      console.error('Error updating subject:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Asignar profesor a materia (solo admins)
  async assignTeacher(subjectId: string, teacherId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('subjects')
      .update({ teacher_id: teacherId })
      .eq('id', subjectId);

    if (error) {
      console.error('Error assigning teacher:', error);
      return false;
    }

    return true;
  },

  // Obtener profesores disponibles
  async getAvailableTeachers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'teacher')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error getting teachers:', error);
      return [];
    }

    return data || [];
  }
};

// 📅 SERVICIOS DE CALENDARIO
export const calendarService = {
  // Obtener eventos según el rol del usuario
  async getEvents(userRole: UserRole, userId?: string, year?: number, filter?: EventFilter): Promise<CalendarEvent[]> {
    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        subject:subjects(id, name, code, year),
        creator:users!created_by(id, name)
      `)
      .eq('is_active', true)
      .order('date', { ascending: true });

    // Filtrar según el rol
    if (userRole === 'student' && year) {
      query = query.or(`year.is.null,year.eq.${year}`);
    } else if (userRole === 'teacher' && userId) {
      // Los profesores ven eventos de sus materias o eventos generales
      query = query.or(`year.is.null,subject_id.in.(select id from subjects where teacher_id = '${userId}')`);
    }
    // Los admins ven todos los eventos (sin filtro adicional)

    // Aplicar filtros adicionales
    if (filter?.year) {
      query = query.eq('year', filter.year);
    }

    if (filter?.subject_id) {
      query = query.eq('subject_id', filter.subject_id);
    }

    if (filter?.type) {
      query = query.eq('type', filter.type);
    }

    if (filter?.month) {
      const year = new Date().getFullYear();
      const startDate = `${year}-${String(filter.month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(filter.month).padStart(2, '0')}-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting events:', error);
      return [];
    }

    return data || [];
  },

  // Crear nuevo evento
  async createEvent(eventData: CreateEventForm, userId: string): Promise<CalendarEvent | null> {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        ...eventData,
        created_by: userId
      })
      .select(`
        *,
        subject:subjects(id, name, code, year),
        creator:users!created_by(id, name)
      `)
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Actualizar evento
  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const { data, error } = await supabase
      .from('calendar_events')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        subject:subjects(id, name, code, year),
        creator:users!created_by(id, name)
      `)
      .single();

    if (error) {
      console.error('Error updating event:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Eliminar evento
  async deleteEvent(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('calendar_events')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return false;
    }

    return true;
  }
};

// 📄 SERVICIOS DE DOCUMENTOS
export const documentService = {
  // Obtener documentos según el rol del usuario
  async getDocuments(userRole: UserRole, userId?: string, year?: number, filter?: DocumentFilter): Promise<Document[]> {
    let query = supabase
      .from('documents')
      .select(`
        *,
        subject:subjects(id, name, code, year),
        uploader:users!uploaded_by(id, name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Filtrar según el rol
    if (userRole === 'student' && year) {
      query = query.or(`is_public.eq.true,year.eq.${year}`);
    } else if (userRole === 'teacher' && userId) {
      // Los profesores ven documentos de sus materias
      query = query.or(`uploaded_by.eq.${userId},subject_id.in.(select id from subjects where teacher_id = '${userId}')`);
    }
    // Los admins ven todos los documentos (sin filtro adicional)

    // Aplicar filtros adicionales
    if (filter?.year) {
      query = query.eq('year', filter.year);
    }

    if (filter?.subject_id) {
      query = query.eq('subject_id', filter.subject_id);
    }

    if (filter?.search) {
      query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting documents:', error);
      return [];
    }

    return data || [];
  },

  // Subir nuevo documento
  async uploadDocument(documentData: CreateDocumentForm, userId: string): Promise<Document | null> {
    // Aquí implementarías la subida del archivo a Supabase Storage
    // Por ahora, simularemos con una URL fake
    const fakeUrl = `https://example.com/documents/${documentData.file.name}`;

    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: documentData.title,
        description: documentData.description,
        file_name: documentData.file.name,
        file_url: fakeUrl,
        file_type: documentData.file.type,
        file_size: documentData.file.size,
        subject_id: documentData.subject_id,
        unit_id: documentData.unit_id,
        year: documentData.year,
        is_public: documentData.is_public,
        uploaded_by: userId
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error uploading document:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Eliminar documento
  async deleteDocument(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('documents')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      return false;
    }

    return true;
  }
};

// � SERVICIOS DE UNIDADES Y CONTENIDO
export const unitService = {
  // Obtener unidades de una materia
  async getSubjectUnits(subjectId: string): Promise<SubjectUnit[]> {
    const { data, error } = await supabase
      .from('subject_units')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      console.error('Error getting subject units:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Crear nueva unidad
  async createUnit(subjectId: string, unitData: {
    unit_number: number;
    title: string;
    description?: string;
    order_index?: number;
  }): Promise<SubjectUnit> {
    const { data, error } = await supabase
      .from('subject_units')
      .insert({
        subject_id: subjectId,
        ...unitData,
        order_index: unitData.order_index || unitData.unit_number
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating unit:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Actualizar unidad
  async updateUnit(id: string, updates: Partial<SubjectUnit>): Promise<SubjectUnit> {
    const { data, error } = await supabase
      .from('subject_units')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating unit:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Eliminar unidad
  async deleteUnit(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('subject_units')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting unit:', error);
      return false;
    }

    return true;
  }
};

export const contentService = {
  // Obtener contenido de una materia o unidad
  async getSubjectContent(subjectId: string, unitId?: string): Promise<SubjectContent[]> {
    let query = supabase
      .from('subject_content')
      .select(`
        *,
        creator:users(id, name, role)
      `)
      .eq('subject_id', subjectId)
      .eq('is_active', true);

    if (unitId) {
      query = query.eq('unit_id', unitId);
    }

    const { data, error } = await query
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting subject content:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  // Crear nuevo contenido
  async createContent(contentData: {
    subject_id: string;
    content_type: ContentType;
    title: string;
    content?: string;
    unit_id?: string;
    is_pinned?: boolean;
  }): Promise<SubjectContent> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('subject_content')
      .insert({
        ...contentData,
        created_by: user?.id
      })
      .select(`
        *,
        creator:users(id, name, role)
      `)
      .single();

    if (error) {
      console.error('Error creating content:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Actualizar contenido
  async updateContent(id: string, updates: Partial<SubjectContent>): Promise<SubjectContent> {
    const { data, error } = await supabase
      .from('subject_content')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        creator:users(id, name, role)
      `)
      .single();

    if (error) {
      console.error('Error updating content:', error);
      throw new Error(error.message);
    }

    return data;
  },

  // Eliminar contenido
  async deleteContent(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('subject_content')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting content:', error);
      return false;
    }

    return true;
  }
};

// �📊 SERVICIOS DE ESTADÍSTICAS
export const statsService = {
  async getDashboardStats(): Promise<any> {
    // Obtener estadísticas del dashboard
    const [usersCount, subjectsCount, eventsCount, documentsCount] = await Promise.all([
      supabase.from('users').select('role', { count: 'exact' }),
      supabase.from('subjects').select('*', { count: 'exact' }).eq('is_active', true),
      supabase.from('calendar_events').select('*', { count: 'exact' }).eq('is_active', true).gte('date', new Date().toISOString().split('T')[0]),
      supabase.from('documents').select('*', { count: 'exact' }).eq('is_active', true)
    ]);

    return {
      totalUsers: usersCount.count || 0,
      totalSubjects: subjectsCount.count || 0,
      upcomingEvents: eventsCount.count || 0,
      totalDocuments: documentsCount.count || 0
    };
  }
};
