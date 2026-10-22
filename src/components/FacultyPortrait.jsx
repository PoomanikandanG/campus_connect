import { useState } from 'react'

export default function FacultyPortrait({ name, initials, color = 'blue', photo }) {
  const [failedPhoto, setFailedPhoto] = useState(null)

  return <div className={`profile-avatar ${color}`}>
    {photo && failedPhoto !== photo
      ? <img src={photo} alt={`Portrait of ${name}`} onError={() => setFailedPhoto(photo)}/>
      : <span aria-hidden="true">{initials}</span>}
  </div>
}
