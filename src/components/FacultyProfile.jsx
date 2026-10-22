import { ArrowLeft, Building2, Info, Layers, Map, MapPin } from 'lucide-react'
import './FacultyProfile.css'
import Faculty3DAvatar from './Faculty3DAvatar.jsx'
import FacultyPortrait from './FacultyPortrait.jsx'
import FacultyScheduleStatus from './FacultyScheduleStatus.jsx'

export default function FacultyProfile({ faculty }) {
  return (
    <div className="container profile-page">
      <a className="profile-back" href="#faculty"><ArrowLeft size={17} aria-hidden="true"/>Back to Faculty Directory</a>
      {faculty ? <>
        <div className="profile-overview">
        <section className="profile-card" aria-labelledby="profile-name">
          <div className="profile-identity">
            <FacultyPortrait name={faculty.name} initials={faculty.initials} color={faculty.color} photo={faculty.photo}/>
            <div className="profile-heading">
              <p className="section-kicker">FACULTY PROFILE</p>
              <h1 id="profile-name">{faculty.name}</h1>
              {faculty.role !== 'Designation not provided' && <p className="profile-role">{faculty.role}</p>}
              <span className="department-tag">{faculty.department}</span>
            </div>
          </div>
          <section className="profile-subjects" aria-labelledby="subjects-heading">
            <h2 id="subjects-heading">Subjects taught</h2>
            <p className="profile-role">Subject area: <strong>{faculty.subjectArea || 'Not confirmed'}</strong></p>
            {faculty.subjects.length ? <ul>{faculty.subjects.map(subject => <li key={subject}>{subject}</li>)}</ul> : <p className="profile-role">Subjects not provided</p>}
          </section>
          <div className="profile-location">
            <h2>Cabin location</h2>
            <dl className="profile-location-grid">
              <div><dt><Building2 size={18} aria-hidden="true"/>Building</dt><dd>{faculty.building}</dd></div>
              <div><dt><Layers size={18} aria-hidden="true"/>Floor</dt><dd>{faculty.floor}</dd></div>
              <div><dt><MapPin size={18} aria-hidden="true"/>Cabin number</dt><dd>{faculty.cabin}</dd></div>
            </dl>
          </div>
        </section>
        <Faculty3DAvatar initials={faculty.initials} config={faculty.avatar}/>
        </div>
        <div className="demo-notice profile-notice"><Info size={19} aria-hidden="true"/><p><strong>Fictional demonstration data.</strong> Building, floor, and cabin locations are fictional and are provided for this prototype only.</p></div>
        <div className="profile-previews">
          <section className="profile-preview" aria-labelledby="map-preview-title">
            <span className="profile-preview-icon"><Map size={23} aria-hidden="true"/></span>
            <h2 id="map-preview-title">Cabin Map — Coming Soon</h2>
            <p>A cabin map preview will be available in a future update.</p>
            <span className="unavailable-label">Unavailable preview</span>
          </section>
          <FacultyScheduleStatus key={faculty.id} faculty={faculty}/>
        </div>
      </> : <section className="empty-results"><h1>Faculty not found</h1><p>We couldn't find this faculty member. Return to the faculty directory to choose someone else.</p></section>}
    </div>
  )
}
