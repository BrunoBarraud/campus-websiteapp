// Script para actualizar las URLs de imagen en la base de datos
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateImageUrls() {
  console.log('🔄 Actualizando URLs de imagen...');
  
  // Actualizar todas las materias que tengan la imagen default.jpg
  const { data, error } = await supabase
    .from('subjects')
    .update({ image_url: '/images/subjects/default.svg' })
    .eq('image_url', '/images/subjects/default.jpg')
    .select('id, name, image_url');
  
  if (error) {
    console.error('❌ Error actualizando imágenes:', error);
    return;
  }
  
  console.log(`✅ ${data?.length || 0} materias actualizadas:`);
  data?.forEach(subject => {
    console.log(`  - ${subject.name}: ${subject.image_url}`);
  });
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  updateImageUrls()
    .then(() => {
      console.log('🎉 Actualización completada!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { updateImageUrls };
