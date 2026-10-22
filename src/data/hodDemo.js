// Fictional presentation data only. No real faculty identities or assignments.
const hours = Object.fromEntries([1, 2, 3, 4, 5, 6].map(day => [day, [
  { start: '10:00', end: '12:00' }, { start: '14:00', end: '16:00' },
]]))
export const hodDemo = [
  ['aiml', 'Dr. Aster Rao'], ['cse', 'Dr. Rowan Sen'],
  ['ise', 'Dr. Mira Vale'], ['ece', 'Dr. Dev Arden'],
].map(([department, name]) => ({
  id: `fictional-hod-${department}`, name: `${name} (Fictional)`, department: department.toUpperCase(),
  designation: 'Head of Department', office: `Demo ${department.toUpperCase()} office`,
  description: 'A fictional HOD for demonstrating student guidance and meeting requests.',
  duration: 30, weeklyHours: hours,
}))
export const demoStudents = [
  { id: 'demo-student-01', name: 'Alex (Demo Student)', department: 'AIML' },
  { id: 'demo-student-02', name: 'Sam (Demo Student)', department: 'CSE' },
  { id: 'demo-student-03', name: 'Jamie (Demo Student)', department: 'ISE' },
]
export const reasonCategories = ['Academic guidance', 'Project discussion', 'Administrative request', 'General meeting', 'Other']
export const appointmentStatuses = ['Pending', 'Approved', 'Declined', 'Reschedule Proposed', 'Cancelled']
