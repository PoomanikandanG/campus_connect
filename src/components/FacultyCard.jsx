import { MapPin, ArrowUpRight } from 'lucide-react'
import { facultyProfileHref } from '../utils/faculty'

export default function FacultyCard({ faculty }) {
  return <article className="faculty-card">
    <h3>{faculty.name}</h3>
    <span className="department-tag">{faculty.department}</span>
    <div className="cabin-location"><MapPin size={18} aria-hidden="true"/><p>Cabin {faculty.cabin}<span>{faculty.building}</span></p></div>
    <a className="view-details" href={facultyProfileHref(faculty.id)} aria-label={`View Profile for ${faculty.name}`}>View Profile<ArrowUpRight size={16} aria-hidden="true"/></a>
  </article>
}
