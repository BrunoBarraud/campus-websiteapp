import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function createAdminUser() {
  console.log('👑 Creando usuario administrador...')
  
  try {
    // 1. Crear usuario en Auth
    const adminEmail = 'admin@ipdvs.edu.ar'
    const adminPassword = 'admin123456'
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    })
    
    if (authError) {
      console.error('❌ Error creando usuario Auth:', authError)
      return
    }
    
    console.log(`✅ Usuario Auth creado: ${authUser.user?.id}`)
    
    // 2. Crear usuario en la tabla users
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: authUser.user!.id,
        email: adminEmail,
        name: 'Administrador del Sistema',
        role: 'admin'
      })
      
    if (dbError) {
      console.error('❌ Error creando usuario en BD:', dbError)
      return
    }
    
    console.log('✅ Usuario agregado a la tabla users')
    
    // 3. Verificar
    const { data: adminCheck } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single()
      
    console.log('\n👑 Usuario administrador creado exitosamente:')
    console.log(`   📧 Email: ${adminEmail}`)
    console.log(`   🔑 Password: ${adminPassword}`)
    console.log(`   🆔 ID: ${adminCheck?.id}`)
    console.log(`   👤 Nombre: ${adminCheck?.name}`)
    console.log(`   🛡️  Rol: ${adminCheck?.role}`)
    
    console.log('\n🎯 Ahora puedes hacer login como administrador!')
    
  } catch (error) {
    console.error('💥 Error:', error)
  }
}

createAdminUser()
