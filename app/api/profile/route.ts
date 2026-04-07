import { NextRequest, NextResponse } from 'next/server'

// Mock database - en producción usarías una base de datos real
let userProfile = {
  id: '1',
  firstName: 'Jovine',
  lastName: 'Klef',
  displayName: 'Jovine Klef',
  email: 'jovine.klef@example.com',
  bio: 'Product designer and developer based in New York. I enjoy creating user-centric, delightful, and human experiences.',
  website: '',
  avatar: '/diverse-group-city.png',
  jobTitle: 'Senior Product Designer',
  company: 'Veselty Inc.',
  location: 'New York, USA',
  timezone: 'america-new_york',
  skills: ['UI Design', 'UX Research', 'Prototyping', 'Figma', 'React']
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: userProfile
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validación básica
    const requiredFields = ['firstName', 'lastName', 'displayName', 'email']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Actualizar el perfil
    userProfile = {
      ...userProfile,
      ...body,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: userProfile,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}