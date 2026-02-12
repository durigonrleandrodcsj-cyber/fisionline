// netlify/functions/deletePatientVideos.js
const cloudinary = require('cloudinary').v2;

// Asegúrate de tener estas variables en Netlify (Site settings > Build & deploy > Environment)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.handler = async (event, context) => {
  // Headers estándar para evitar problemas de CORS y tipo de contenido
  const headers = {
    "Access-Control-Allow-Origin": "*", // O restringe a tu dominio en producción
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // Manejo de pre-flight request (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: "Ready" }) };
  }

  try {
    // 1. Validación de cuerpo de solicitud
    if (!event.body) {
      throw new Error("El cuerpo de la solicitud está vacío");
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (e) {
      throw new Error("El cuerpo de la solicitud no es un JSON válido");
    }

    const { public_id, resource_type } = parsedBody;

    if (!public_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: "Falta el public_id del video" })
      };
    }

    // 2. Intentar eliminar en Cloudinary
    // Nota: invalidate: true ayuda a limpiar cachés de CDN
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type || 'video',
      invalidate: true 
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Error en Cloudinary: ${result.result}`);
    }

    // 3. RETORNO EXITOSO (Siempre JSON válido)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: "Video eliminado correctamente", 
        data: result 
      })
    };

  } catch (error) {
    console.error("Server Error:", error);
    
    // 4. RETORNO DE ERROR (Siempre JSON válido, nunca texto plano)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: error.message || "Error interno del servidor desconocido" 
      })
    };
  }
};