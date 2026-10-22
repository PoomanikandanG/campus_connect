import { CalendarCheck, GraduationCap, BriefcaseBusiness, ArrowRight } from 'lucide-react'
import { AppLink } from '../hooks/useAppPath'
import DemoModeNotice from '../components/appointments/DemoModeNotice'
export default function HodAppointmentsHome() {
  return <section className="container appointment-page"><DemoModeNotice/>
    <header className="appointment-intro"><p className="section-kicker">CAMPUSCONNECT | HOD APPOINTMENTS</p>
      <h1>Meet Your HOD,<br/><span>Without the Wait.</span></h1>
      <p>Request meetings with your Head of Department, manage appointments, and stay updated - all in one place.</p>
    </header>
    <div className="demo-entry-grid"><article><GraduationCap size={30} aria-hidden="true"/><p className="appointment-kicker">DEMO MODE</p><h2>A little guidance starts here.</h2>
      <p>Choose a fictional HOD, request a meeting, and follow its progress from pending to approved.</p><AppLink className="appointment-primary" href="/hod-appointments/student">Continue as Demo Student <ArrowRight size={17}/></AppLink></article>
      <article><BriefcaseBusiness size={30} aria-hidden="true"/><p className="appointment-kicker">DEMO MODE</p><h2>Make room for conversations.</h2>
      <p>Review demo requests, propose a better time, and manage your fictional appointment slots.</p><AppLink className="appointment-primary" href="/hod-appointments/hod">Continue as Demo HOD <ArrowRight size={17}/></AppLink></article></div>
    <section className="appointment-how"><CalendarCheck size={25} aria-hidden="true"/><div><h2>Try the complete meeting workflow</h2><p>1. Request as a student. 2. Switch to the matching Demo HOD and review. 3. Switch back to see the result. Approved future meetings appear under Upcoming Appointments.</p><p>No real appointments are created or messages sent.</p></div></section>
  </section>
}
