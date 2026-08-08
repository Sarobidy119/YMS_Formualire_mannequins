-- Les mannequins sont gérés exclusivement par l'administration YMS :
-- aucun compte Auth n'est créé pour eux.
alter table models alter column profile_id drop not null;

comment on column models.profile_id is 'Optionnel : réservé à une éventuelle évolution future avec espace mannequin.';
