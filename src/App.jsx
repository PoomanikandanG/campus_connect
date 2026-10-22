import { AuthProvider } from './auth/AuthProvider'
import { AppLink, useAppPath } from './hooks/useAppPath'
import AppointmentDemo from './components/appointments/AppointmentDemo'
import { AccountPage } from './components/HodAppointments'
import { useEffect, useMemo, useRef, useState } from 'react'
import { GraduationCap, Search, ChevronDown, ArrowUpRight, MapPin, Users, Info, Compass } from 'lucide-react'
import { faculty as facultyRecords } from './data/faculty'
import { createFacultyDirectory } from './utils/faculty'
import FacultyCard from './components/FacultyCard'
import FacultyProfile from './components/FacultyProfile'
import { useFacultyRoute } from './hooks/useFacultyRoute'

function Brand() { return <AppLink className="brand" href="/" aria-label="CampusConnect home"><span className="brand-icon"><GraduationCap size={25}/></span><span>Campus<span className="brand-accent">Connect</span><span className="brand-dot">.</span></span></AppLink> }

export default function App({ records = facultyRecords }) {
  const { faculty, byId, departments } = useMemo(() => createFacultyDirectory(records), [records])
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [subjectArea, setSubjectArea] = useState('')
  const path = useAppPath()
  const demoRoute = ['/hod-appointments', '/hod-appointments/student', '/hod-appointments/hod'].includes(path)
  const v2 = demoRoute || ['/login', '/student', '/hod'].includes(path)
  const profileId = useFacultyRoute()
  const isProfile = profileId !== null
  const selectedFaculty = byId.get(profileId)
  const mainRef = useRef(null)

  useEffect(() => {
    document.title = v2 ? 'HOD Appointments | CampusConnect' : isProfile
      ? `${selectedFaculty?.name ?? 'Faculty not found'} | CampusConnect`
      : 'CampusConnect — Faculty Finder'
    mainRef.current?.focus()
  }, [isProfile, profileId, selectedFaculty, path, v2])

  const query = search.trim().toLowerCase()
  const matchingFaculty = faculty.filter(person =>
    (person.name.toLowerCase().includes(query) || person.subjects.some(subject => subject.toLowerCase().includes(query))) &&
    (!department || person.department === department) &&
    (!subjectArea || person.subjectArea === subjectArea)
  )
  const hasFilters = search.length > 0 || department !== '' || subjectArea !== ''

  function clearFilters() {
    setSearch('')
    setDepartment('')
    setSubjectArea('')
  }

  return <div>
    <header className="site-header"><nav className="container nav" aria-label="Main navigation"><Brand/><div className="nav-links"><AppLink className={v2 ? "" : "active"} href="/#faculty">Faculty directory</AppLink><span className="nav-divider"/><AppLink className={v2 ? "active hod-nav-link" : "student-label hod-nav-link"} href="/hod-appointments">HOD Appointments <ArrowUpRight size={15}/></AppLink></div><span className="mobile-nav-label">Faculty finder</span><AppLink className="appointments-mobile-link" href="/hod-appointments">HOD Appointments</AppLink></nav></header>
    <main ref={mainRef} tabIndex={-1}>
      {demoRoute ? <AppointmentDemo path={path}/> : v2 ? <AuthProvider><AccountPage path={path}/></AuthProvider> : isProfile ? <FacultyProfile faculty={selectedFaculty}/> : <>
      <section className="hero"><div className="container hero-grid"><div className="hero-copy"><div className="eyebrow"><span/> LESS WANDERING. MORE CONNECTING.</div><h1>Find Your Faculty,<br/><span>Without the Hassle.</span></h1><p className="hero-description">Find faculty cabin locations and scheduled teaching information in one place. Make every campus visit count.</p></div>
      <div className="hero-art" aria-hidden="true"><div className="art-grid"/><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="floating-label location-label"><span className="floating-icon"><MapPin size={20}/></span><div><small>YOUR NEXT STOP</small><strong>A little easier to find.</strong></div></div><div className="campus-building"><div className="building-roof"><GraduationCap size={38}/></div><div className="building-title">CAMPUS CONNECT</div><div className="building-columns">{[0,1,2,3].map(n=><div key={n}><span/><span/></div>)}</div><div className="building-steps"><span/><span/></div></div><div className="floating-label connect-label"><span className="connected-dot"/><span>A more connected campus</span></div><div className="art-spark spark-one">✦</div><div className="art-spark spark-two">+</div></div>
      </div></section>
      <section className="directory container" id="faculty"><div className="section-heading"><div><div className="section-kicker">YOUR CAMPUS, CONNECTED</div><h2>A familiar face is a search away.</h2><p>Discover the people who help you move forward.</p></div><span className="faculty-count"><Users size={17}/> {matchingFaculty.length} faculty {matchingFaculty.length === 1 ? 'member' : 'members'}</span></div>
      <form className="search-panel" role="search" onSubmit={event => event.preventDefault()}>
        <div className="search-field"><Search size={22} aria-hidden="true"/><label className="sr-only" htmlFor="faculty-search">Search faculty by name or subject</label><input id="faculty-search" type="search" placeholder="Search by name or subject" value={search} onChange={event => setSearch(event.target.value)} aria-controls="faculty-results"/></div>
        <div className="filter-field"><label className="sr-only" htmlFor="department">Department</label><select id="department" value={department} onChange={event => setDepartment(event.target.value)} aria-controls="faculty-results"><option value="">All departments</option>{departments.map(name => <option key={name} value={name}>{name}</option>)}</select><ChevronDown size={17} aria-hidden="true"/></div>
        <div className="filter-field"><label className="sr-only" htmlFor="subject-area">Subject area</label><select id="subject-area" value={subjectArea} onChange={event => setSubjectArea(event.target.value)} aria-controls="faculty-results"><option value="">All Subjects</option>{['Computer Science', 'Mathematics', 'Interdisciplinary'].map(area => <option key={area} value={area}>{area}</option>)}</select><ChevronDown size={17} aria-hidden="true"/></div>
        <button className="search-button" type="submit"><Search size={18} aria-hidden="true"/><span>Find faculty</span></button>
      </form>
      <div className="results-line"><span role="status" aria-live="polite" aria-atomic="true">Showing <strong>{matchingFaculty.length}</strong> of {faculty.length} faculty members</span>{hasFilters && matchingFaculty.length > 0 && <button className="clear-filters" type="button" onClick={clearFilters}>Clear Filters</button>}</div>
      <div id="faculty-results">
        {matchingFaculty.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{matchingFaculty.map(person=><FacultyCard key={person.id} faculty={person}/>)}</div> :
          <div className="empty-results"><Search size={28} aria-hidden="true"/><h3>No faculty found</h3><p>Try a different name, subject, department, or subject area. You can also clear your filters to see everyone.</p><button className="search-button" type="button" onClick={clearFilters}>Clear Filters</button></div>}
      </div>
      <div className="demo-notice"><Info size={18}/><p><strong>A little heads-up:</strong> This is a prototype. All faculty details and cabin locations shown are demo data.</p><span>PREVIEW VERSION</span></div></section>
      <section className="closing container"><span className="closing-icon"><Compass size={23}/></span><div><h2>Less time looking. More time learning.</h2><p>A simpler way to feel at home on campus.</p></div><GraduationCap className="closing-cap" size={45}/></section>
      </>}
    </main><footer className="container footer"><Brand/><p>Bringing students and faculty closer.</p><span>CampusConnect © {new Date().getFullYear()}</span></footer>
  </div>
}
