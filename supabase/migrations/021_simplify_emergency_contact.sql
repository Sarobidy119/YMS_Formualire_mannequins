-- Le formulaire ne collecte plus que le numéro du contact d'urgence.
-- Les anciennes colonnes restent disponibles pour préserver l'historique,
-- mais ne doivent plus empêcher la création d'un mannequin.
alter table public.models
  alter column emergency_contact_name drop not null,
  alter column emergency_contact_relation drop not null;
