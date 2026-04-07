import { NextRequest, NextResponse } from 'next/server'

// En producción, usarías un servicio como Cloudinary, AWS S3, etc.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validar tamaño (2MB máximo)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 2MB.' },
        { status: 400 }
      )
    }

    // En desarrollo, simulamos la subida
    // En producción, subirías a un servicio de almacenamiento
    const fileName = `avatar-${Date.now()}.${file.type.split('/')[1]}`
    const avatarUrl = `/uploads/avatars/${fileName}` // URL simulada

    // Aquí iría el código para subir a Cloudinary/S3/etc.
    // Por ahora, solo devolvemos una URL simulada

    return NextResponse.json({
      success: true,
      data: {
        avatarUrl,
        fileName,
        uploadedAt: new Date().toISOString()
      },
      message: 'Avatar uploaded successfully'
    })

  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}