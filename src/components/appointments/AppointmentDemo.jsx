import { AppointmentDemoProvider } from './AppointmentDemoContext'
import HodAppointmentsHome from '../../pages/HodAppointmentsHome'
import StudentAppointments from '../../pages/StudentAppointments'
import HodDemoDashboard from '../../pages/HodDemoDashboard'
import './appointments.css'
export default function AppointmentDemo({ path }) {
  return <AppointmentDemoProvider>{path === '/hod-appointments/student' ? <StudentAppointments/> : path === '/hod-appointments/hod' ? <HodDemoDashboard/> : <HodAppointmentsHome/>}</AppointmentDemoProvider>
}
