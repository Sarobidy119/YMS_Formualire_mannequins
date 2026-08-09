import jsPDF from 'jspdf'
import type { ModelFullProfile } from '../types/database.types'
import { calculateAge, formatStatus } from '../utils/formatters'

// Export PDF "Model Profile" côté client.
// N'inclut JAMAIS : contact d'urgence, notes internes, observations admin.
export function exportModelProfilePDF(model: ModelFullProfile) {
  const doc = new jsPDF()
  const margin = 20
  let y = margin

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('YMS', margin, y)
  y += 8
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('MODEL PROFILE', margin, y)
  y += 12

  doc.setDrawColor(124, 58, 237)
  doc.line(margin, y, 190, y)
  y += 10

  doc.setFontSize(11)
  const line = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label} :`, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value || '—', margin + 55, y)
    y += 8
  }

  line('ID', model.yms_id)
  line('Nom', `${model.first_name} ${model.last_name}`)
  line('Âge', `${calculateAge(model.birth_date)} ans`)
  line('Sexe', model.gender)
  line('Ville', model.city)
  if (model.measurements) {
    line('Taille', `${model.measurements.height_cm} cm`)
    line('Pointure', model.measurements.shoe_size?.toString() ?? '—')
    line('Taille vêtement', model.measurements.clothing_size ?? '—')
    line(
      'Mensurations',
      [model.measurements.chest_cm, model.measurements.waist_cm, model.measurements.hips_cm]
        .filter(Boolean)
        .join(' / ') || '—'
    )
  }
  line('Statut', formatStatus(model.status))
  y += 4

  doc.setFont('helvetica', 'bold')
  doc.text('Expérience', margin, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  if (model.experiences.length === 0) {
    doc.text('Aucune expérience renseignée', margin, y)
    y += 6
  } else {
    model.experiences.forEach((exp) => {
      doc.text(`• ${exp.label}${exp.details ? ' — ' + exp.details : ''}`, margin, y)
      y += 6
    })
  }

  y += 4
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Compétences', margin, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(model.skills.map((s) => s.label).join(', ') || 'Aucune', margin, y)
  y += 10

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Disponibilité', margin, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  if (model.availability) {
    const avail = [
      model.availability.available_runway && 'Défilé',
      model.availability.available_shooting && 'Shooting',
      model.availability.available_ad && 'Publicité',
      model.availability.available_event && 'Événementiel',
    ].filter(Boolean)
    doc.text(avail.join(', ') || 'Non renseignée', margin, y)
  }

  doc.save(`${model.yms_id}-profile.pdf`)
}
