import { NextRequest, NextResponse } from 'next/server'

// Mock database - en producción usarías una base de datos real
let userSkills = ['UI Design', 'UX Research', 'Prototyping', 'Figma', 'React']

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: userSkills
    })
  } catch (error) {
    console.error('Error fetching skills:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { skill } = body

    if (!skill || typeof skill !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Skill name is required and must be a string' },
        { status: 400 }
      )
    }

    const trimmedSkill = skill.trim()

    if (trimmedSkill.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Skill name cannot be empty' },
        { status: 400 }
      )
    }

    if (userSkills.includes(trimmedSkill)) {
      return NextResponse.json(
        { success: false, error: 'Skill already exists' },
        { status: 400 }
      )
    }

    userSkills.push(trimmedSkill)

    return NextResponse.json({
      success: true,
      data: userSkills,
      message: 'Skill added successfully'
    })
  } catch (error) {
    console.error('Error adding skill:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add skill' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const skill = searchParams.get('skill')

    if (!skill) {
      return NextResponse.json(
        { success: false, error: 'Skill name is required' },
        { status: 400 }
      )
    }

    const skillIndex = userSkills.indexOf(skill)

    if (skillIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Skill not found' },
        { status: 404 }
      )
    }

    userSkills.splice(skillIndex, 1)

    return NextResponse.json({
      success: true,
      data: userSkills,
      message: 'Skill removed successfully'
    })
  } catch (error) {
    console.error('Error removing skill:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove skill' },
      { status: 500 }
    )
  }
}